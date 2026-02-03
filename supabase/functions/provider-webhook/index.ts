// provider-webhook Edge Function: receives KIE.ai notifications
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

type WebhookPayload = {
  taskId?: string;
  task_id?: string;
  status?: string;
  provider?: string;
  [key: string]: any;
};

Deno.serve(async (req: Request): Promise<Response> => {
  const t0 = Date.now();
  const method = req.method;

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (method !== 'POST') {
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

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch (err) {
    console.error('[WEBHOOK] Invalid JSON payload:', err);
    return json({ error: 'Invalid JSON' }, 400);
  }

  const taskId = payload.taskId || payload.task_id;
  const status = payload.status;

  console.log('[WEBHOOK] Received payload:', JSON.stringify(payload, null, 2));

  if (!taskId) {
    console.error('[WEBHOOK] Missing taskId in payload');
    return json({ error: 'Missing taskId' }, 400);
  }

  const supabase = createServiceClient();

  // Find generation by provider task id
  const { data: providerTask, error: taskError } = await supabase
    .from('provider_tasks')
    .select('generation_id, task_id')
    .eq('task_id', taskId)
    .single();

  if (taskError || !providerTask) {
    console.error('[WEBHOOK] provider_tasks not found:', taskError?.message);
    return json({ error: 'Task not found' }, 404);
  }

  console.log(`[WEBHOOK] Found generation_id=${providerTask.generation_id} for taskId=${taskId}`);

  // Invoke status to finalize result (download, assets, credits)
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ generationId: providerTask.generation_id, status }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      console.error(`[WEBHOOK] status call failed: ${response.status} ${bodyText}`);
      return json({ error: 'Status invoke failed' }, 500);
    }
  } catch (err) {
    console.error('[WEBHOOK] status invoke error:', err);
    return json({ error: 'Status invoke error' }, 500);
  }

  const durationMs = Date.now() - t0;
  console.log(`[WEBHOOK] Completed in ${durationMs}ms`);

  return json({ ok: true, taskId, durationMs }, 200);
});
