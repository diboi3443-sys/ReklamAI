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

// KIE callback payload format
// Reference: https://docs.kie.ai/common-api/webhook-verification
type WebhookPayload = {
  // Task identification
  taskId?: string;
  task_id?: string;
  
  // Status fields
  status?: string;
  state?: string;  // KIE uses 'state' sometimes
  code?: number;   // KIE response code (200 = success)
  
  // Result data
  data?: {
    taskId?: string;
    state?: string;
    resultJson?: string;  // JSON string with output URLs
    resultUrls?: string[];
    outputUrl?: string;
    url?: string;
    failMsg?: string;
    failCode?: string;
    progress?: number;
  };
  
  // Provider info
  provider?: string;
  msg?: string;
  
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

  // Extract taskId from various possible locations in the payload
  const taskId = payload.taskId || payload.task_id || payload.data?.taskId;
  
  // Extract status from various possible locations
  const status = payload.status || payload.state || payload.data?.state || 
                 (payload.code === 200 ? 'succeeded' : undefined);

  console.log('[WEBHOOK] Received payload:', JSON.stringify(payload, null, 2));
  console.log(`[WEBHOOK] Extracted taskId: ${taskId}, status: ${status}`);

  if (!taskId) {
    console.error('[WEBHOOK] Missing taskId in payload');
    return json({ error: 'Missing taskId' }, 400);
  }
  
  // Extract output URL from result data
  let outputUrl: string | undefined;
  if (payload.data?.resultJson) {
    try {
      const result = JSON.parse(payload.data.resultJson);
      outputUrl = result.resultUrls?.[0] || result.url || result.output_url;
    } catch (e) {
      console.log('[WEBHOOK] Could not parse resultJson');
    }
  }
  outputUrl = outputUrl || payload.data?.outputUrl || payload.data?.url || 
              payload.data?.resultUrls?.[0];
  
  console.log(`[WEBHOOK] Extracted outputUrl: ${outputUrl || 'none'}`);
  
  // Check for error
  const errorMsg = payload.data?.failMsg || payload.data?.failCode || 
                   (payload.code && payload.code !== 200 ? payload.msg : undefined);

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

  // Update provider_tasks with callback data
  const { error: updateError } = await supabase
    .from('provider_tasks')
    .update({
      status: status || 'processing',
      raw: payload,
      updated_at: new Date().toISOString(),
    })
    .eq('task_id', taskId);
  
  if (updateError) {
    console.error('[WEBHOOK] Failed to update provider_tasks:', updateError.message);
  }

  // If we have error info, update generation as failed
  if (errorMsg) {
    console.log(`[WEBHOOK] Task failed with error: ${errorMsg}`);
    
    await supabase
      .from('generations')
      .update({
        status: 'failed',
        error: { message: errorMsg, raw: payload },
        updated_at: new Date().toISOString(),
      })
      .eq('id', providerTask.generation_id);
    
    return json({ ok: true, taskId, status: 'failed', error: errorMsg }, 200);
  }

  // Invoke status to finalize result (download, assets, credits)
  // Pass outputUrl if available from callback
  try {
    const statusPayload: any = { 
      generationId: providerTask.generation_id, 
      status: status || 'succeeded'
    };
    
    // If callback includes output URL, pass it to status for download
    if (outputUrl) {
      statusPayload.outputUrl = outputUrl;
    }
    
    console.log(`[WEBHOOK] Calling status endpoint with:`, JSON.stringify(statusPayload));
    
    const response = await fetch(`${supabaseUrl}/functions/v1/status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusPayload),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      console.error(`[WEBHOOK] status call failed: ${response.status} ${bodyText}`);
      return json({ error: 'Status invoke failed' }, 500);
    }
    
    const statusResult = await response.json();
    console.log(`[WEBHOOK] Status result:`, JSON.stringify(statusResult));
  } catch (err) {
    console.error('[WEBHOOK] status invoke error:', err);
    return json({ error: 'Status invoke error' }, 500);
  }

  const durationMs = Date.now() - t0;
  console.log(`[WEBHOOK] Completed in ${durationMs}ms`);

  return json({ ok: true, taskId, durationMs }, 200);
});
