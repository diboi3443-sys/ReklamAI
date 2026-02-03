// sync-generations Edge Function: server-side polling for stale generations
import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase.ts';

function json(data: any, status: number): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

Deno.serve(async (req: Request): Promise<Response> => {
  const t0 = Date.now();
  const method = req.method;

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (method !== 'GET' && method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SERVICE_ROLE_KEY');

  if (!supabaseUrl) {
    return json({ error: 'Missing env: SUPABASE_URL' }, 500);
  }
  if (!serviceKey) {
    return json({ error: 'Missing secret: SERVICE_ROLE_KEY' }, 500);
  }

  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();

  console.log(`[SYNC] Starting sync-generations at ${new Date().toISOString()}`);
  console.log(`[SYNC] Looking for generations older than ${cutoff}`);

  const { data: generations, error } = await supabase
    .from('generations')
    .select('id, status, created_at, updated_at, owner_id')
    .in('status', ['queued', 'processing'])
    .lt('created_at', cutoff);

  if (error) {
    console.error('[SYNC] Failed to load generations:', error);
    return json({ error: 'Failed to load generations' }, 500);
  }

  const total = generations?.length || 0;
  console.log(`[SYNC] Found ${total} stale generations`);

  if (!generations || generations.length === 0) {
    return json({
      found: 0,
      processed: 0,
      failed: 0,
      durationMs: Date.now() - t0,
    }, 200);
  }

  let processed = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    generations.map(async (gen) => {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/status`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ generationId: gen.id }),
        });

        if (!response.ok) {
          const bodyText = await response.text();
          console.error(`[SYNC] status failed for ${gen.id}: ${response.status} ${bodyText}`);
          failed += 1;
          return;
        }

        processed += 1;
      } catch (err) {
        console.error(`[SYNC] status exception for ${gen.id}:`, err);
        failed += 1;
      }
    })
  );

  const rejected = results.filter((r) => r.status === 'rejected').length;
  if (rejected > 0) {
    console.error(`[SYNC] ${rejected} tasks rejected during Promise.allSettled`);
  }

  console.log(`[SYNC] Completed: processed=${processed}, failed=${failed}`);

  return json({
    found: total,
    processed,
    failed,
    durationMs: Date.now() - t0,
  }, 200);
});
