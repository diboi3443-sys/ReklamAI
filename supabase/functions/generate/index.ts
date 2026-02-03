// Generate Edge Function: Creates a new generation and reserves credits
// For CLI deployment: use ../_shared/ imports (CLI handles this correctly)
import { corsHeaders } from '../_shared/cors.ts';
import { createAuthedUserClient } from '../_shared/auth.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { generateSchema } from '../_shared/validation.ts';
import { reserveCredits, estimateCredits, refundCredits } from '../_shared/credits.ts';
import { kieGenerate } from '../_shared/providers/kie.ts';
import type { ProviderGeneratePayload } from '../_shared/providers/types.ts';

// Helper to create JSON response with CORS headers
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

// Main handler
Deno.serve(async (req: Request): Promise<Response> => {
  const t0 = Date.now();
  const method = req.method;

  console.log(`[GENERATE] start method=${method} at ${new Date().toISOString()}`);
  console.log(`[GENERATE] URL: ${req.url}`);

  // 1) Handle CORS preflight (OPTIONS) - return immediately, NO auth required
  if (method === 'OPTIONS') {
    const duration = Date.now() - t0;
    console.log(`[GENERATE] preflight handled in ${duration}ms`);
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // 2) Handle non-POST methods
  if (method !== 'POST') {
    const duration = Date.now() - t0;
    console.log(`[GENERATE] method not allowed: ${method} (returning 405 in ${duration}ms)`);
    return json({ error: 'Method not allowed' }, 405);
  }

  // 3) Validate KIE secrets (for generate function)
  const KIE_API_KEY = Deno.env.get('KIE_API_KEY');
  if (!KIE_API_KEY) {
    const duration = Date.now() - t0;
    console.error(`[GENERATE] Missing KIE_API_KEY after ${duration}ms`);
    return json({ error: 'Missing secret: KIE_API_KEY' }, 500);
  }

  console.log(`[GENERATE] KIE_API_KEY found, length: ${KIE_API_KEY.length}`);

  let generation: any = null;
  let user: { id: string; email?: string } | null = null;

  try {
    // Step 1: Create service client
    const tService = Date.now();
    console.log(`[GENERATE] [STEP 1] BEFORE creating service client at ${tService - t0}ms`);
    const supabase = createServiceClient();
    const serviceDuration = Date.now() - tService;
    console.log(`[GENERATE] [STEP 1] AFTER service client created in ${serviceDuration}ms`);

    // Step 2: Authenticate user
    const tAuth = Date.now();
    console.log(`[GENERATE] [STEP 2] BEFORE auth check at ${tAuth - t0}ms`);
    const authResult = await createAuthedUserClient(req);
    const authDuration = Date.now() - tAuth;
    console.log(`[GENERATE] [STEP 2] AFTER auth check completed in ${authDuration}ms`);

    if (!authResult) {
      const duration = Date.now() - t0;
      console.error(`[GENERATE] Auth failed (returning 401 in ${duration}ms)`);
      return json({ code: 401, message: 'Unauthorized' }, 401);
    }

    user = authResult.user;
    console.log(`[GENERATE] Auth successful, user: ${user.id}`);

    // Step 3: Parse request body
    const tParse = Date.now();
    console.log(`[GENERATE] [STEP 3] BEFORE req.json() at ${tParse - t0}ms`);
    const body = await req.json();
    const parseDuration = Date.now() - tParse;
    console.log(`[GENERATE] [STEP 3] AFTER req.json() completed in ${parseDuration}ms`);

    const tValidate = Date.now();
    console.log(`[GENERATE] [STEP 3b] BEFORE validation at ${tValidate - t0}ms`);
    const validationResult = generateSchema.safeParse(body);
    const validateDuration = Date.now() - tValidate;
    console.log(`[GENERATE] [STEP 3b] AFTER validation completed in ${validateDuration}ms`);

    if (!validationResult.success) {
      return json({ error: 'Invalid payload', details: validationResult.error }, 400);
    }

    const { boardId, presetKey, modelKey, prompt, input } = validationResult.data;

    // Step 4: Verify board access if provided
    if (boardId) {
      const tBoard = Date.now();
      console.log(`[GENERATE] [STEP 4] BEFORE board access query at ${tBoard - t0}ms`);
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .select('id, owner_id')
        .eq('id', boardId)
        .single();
      const boardDuration = Date.now() - tBoard;
      console.log(`[GENERATE] [STEP 4] AFTER board access query completed in ${boardDuration}ms`);

      if (boardError || !board) {
        return json({ error: 'Board not found' }, 404);
      }

      // Check if user owns board or is a member
      const tMember = Date.now();
      console.log(`[GENERATE] [STEP 4b] BEFORE board_members query at ${tMember - t0}ms`);
      const { data: member } = await supabase
        .from('board_members')
        .select('user_id')
        .eq('board_id', boardId)
        .eq('user_id', user.id)
        .single();
      const memberDuration = Date.now() - tMember;
      console.log(`[GENERATE] [STEP 4b] AFTER board_members query completed in ${memberDuration}ms`);

      if (board.owner_id !== user.id && !member) {
        return json({ error: 'Access denied to board' }, 403);
      }
    }

    // Step 5: Load preset and model
    const tPreset = Date.now();
    console.log(`[GENERATE] [STEP 5] BEFORE loading preset at ${tPreset - t0}ms`);
    const { data: preset, error: presetError } = await supabase
      .from('presets')
      .select('*')
      .eq('key', presetKey)
      .single();
    const presetDuration = Date.now() - tPreset;
    console.log(`[GENERATE] [STEP 5] AFTER preset loaded in ${presetDuration}ms`);

    if (presetError || !preset) {
      return json({ error: 'Preset not found' }, 404);
    }

    const tModel = Date.now();
    console.log(`[GENERATE] [STEP 5b] BEFORE loading model at ${tModel - t0}ms`);
    const { data: model, error: modelError } = await supabase
      .from('models')
      .select('*')
      .eq('key', modelKey)
      .single();
    const modelDuration = Date.now() - tModel;
    console.log(`[GENERATE] [STEP 5b] AFTER model loaded in ${modelDuration}ms`);

    if (modelError || !model) {
      return json({ error: 'Model not found' }, 404);
    }

    // Step 6: Get admin settings for markup
    const tAdmin = Date.now();
    console.log(`[GENERATE] [STEP 6] BEFORE loading admin settings at ${tAdmin - t0}ms`);
    const { data: adminSettings } = await supabase
      .from('admin_settings')
      .select('markup_percent')
      .eq('id', 1)
      .single();
    const adminDuration = Date.now() - tAdmin;
    console.log(`[GENERATE] [STEP 6] AFTER admin settings loaded in ${adminDuration}ms`);

    const markupPercent = adminSettings?.markup_percent || 0;

    // Step 7: Estimate credits
    const tEstimate = Date.now();
    console.log(`[GENERATE] [STEP 7] BEFORE estimateCredits at ${tEstimate - t0}ms`);
    const presetDefaults = preset.defaults || {};
    const estimatedCredits = await estimateCredits(
      presetDefaults,
      Number(model.price_multiplier) || 1,
      Number(markupPercent) || 0
    );
    const estimateDuration = Date.now() - tEstimate;
    console.log(`[GENERATE] [STEP 7] AFTER estimateCredits completed in ${estimateDuration}ms: ${estimatedCredits}`);

    // Step 8: Create generation via direct REST API call (bypasses Supabase client issues)
    const tGen = Date.now();
    console.log(`[GENERATE] [STEP 8] Creating generation via REST API...`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const authToken = authResult.token;

    const insertPayload = {
      owner_id: user.id,
      function_key: presetKey,
      preset_id: preset.id,
      model_id: model.id,
      modality: preset.type,
      prompt: prompt,
      status: 'queued',
    };

    if (boardId) (insertPayload as any).board_id = boardId;
    if (input) (insertPayload as any).input = input;
    if (typeof estimatedCredits === 'number') (insertPayload as any).estimated_credits = estimatedCredits;

    console.log(`[GENERATE] Insert payload:`, JSON.stringify(insertPayload));

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'apikey': supabaseAnonKey!,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(insertPayload),
    });

    const insertText = await insertResponse.text();
    console.log(`[GENERATE] Insert response status: ${insertResponse.status}`);
    console.log(`[GENERATE] Insert response: ${insertText.substring(0, 500)}`);

    if (!insertResponse.ok) {
      console.error(`[GENERATE] ❌ Insert failed:`, insertText);
      return json({
        error: 'Failed to create generation',
        details: insertText,
        status: insertResponse.status,
      }, 500);
    }

    let genData;
    try {
      const parsed = JSON.parse(insertText);
      genData = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch (e) {
      console.error(`[GENERATE] ❌ Failed to parse insert response:`, e);
      return json({ error: 'Failed to parse generation response' }, 500);
    }

    if (!genData || !genData.id) {
      console.error(`[GENERATE] ❌ No generation ID in response`);
      return json({ error: 'No generation ID returned' }, 500);
    }

    const genDuration = Date.now() - tGen;
    console.log(`[GENERATE] ✅ Generation created: ${genData.id} in ${genDuration}ms`);
    console.log(`[GENERATE] ✅ Saved prompt: "${genData.prompt}"`);
    console.log(`[GENERATE] ✅ Saved model_id: ${genData.model_id}`);

    // Set generation object for later use
    generation = genData;

    // Step 9: Reserve credits
    const tReserve = Date.now();
    console.log(`[GENERATE] [STEP 9] BEFORE reserveCredits at ${tReserve - t0}ms`);
    console.log(`[GENERATE] Credits amount: ${estimatedCredits}, User ID: ${user.id}, Generation ID: ${generation.id}`);

    let reserveResult;
    try {
      reserveResult = await reserveCredits(
        user.id,
        generation.id,
        estimatedCredits,
        { preset_key: presetKey, model_key: modelKey }
      );
      const reserveDuration = Date.now() - tReserve;
      console.log(`[GENERATE] [STEP 9] AFTER reserveCredits completed in ${reserveDuration}ms: ${reserveResult.success}`);

      if (!reserveResult.success) {
        console.error(`[GENERATE] Credit reservation failed: ${reserveResult.error}`);
        // Update generation status to failed
        await supabase
          .from('generations')
          .update({ status: 'failed', error: { message: reserveResult.error } })
          .eq('id', generation.id);

        return json({ error: reserveResult.error || 'Insufficient credits' }, 402);
      }
    } catch (reserveError: any) {
      const reserveDuration = Date.now() - tReserve;
      console.error(`[GENERATE] [STEP 9] Credit reservation exception after ${reserveDuration}ms:`, reserveError);
      // Update generation status to failed
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error: { message: reserveError.message || 'Credit reservation failed' }
        })
        .eq('id', generation.id);

      return json({
        error: 'Credit reservation failed',
        details: reserveError.message || 'Unknown error'
      }, 500);
    }

    // Step 10: Update reserved_credits
    const tUpdateReserved = Date.now();
    console.log(`[GENERATE] [STEP 10] BEFORE updating reserved_credits at ${tUpdateReserved - t0}ms`);
    await supabase
      .from('generations')
      .update({ reserved_credits: estimatedCredits })
      .eq('id', generation.id);
    const updateReservedDuration = Date.now() - tUpdateReserved;
    console.log(`[GENERATE] [STEP 10] AFTER reserved_credits updated in ${updateReservedDuration}ms`);

    // Step 11: Create signed URLs for input files if needed
    const tUrls = Date.now();
    console.log(`[GENERATE] [STEP 11] BEFORE creating signed URLs at ${tUrls - t0}ms`);
    const inputUrls: any = {};
    if (input?.startFramePath) {
      const tUrl = Date.now();
      const { data: signedUrl } = await supabase.storage
        .from('uploads')
        .createSignedUrl(input.startFramePath, 3600);
      console.log(`[GENERATE] startFramePath signed URL created in ${Date.now() - tUrl}ms`);
      inputUrls.startFrameUrl = signedUrl?.signedUrl;
    }
    if (input?.referenceImagePath) {
      const tUrl = Date.now();
      const { data: signedUrl } = await supabase.storage
        .from('uploads')
        .createSignedUrl(input.referenceImagePath, 3600);
      console.log(`[GENERATE] referenceImagePath signed URL created in ${Date.now() - tUrl}ms`);
      inputUrls.referenceImageUrl = signedUrl?.signedUrl;
    }
    if (input?.referenceVideoPath) {
      const tUrl = Date.now();
      const { data: signedUrl } = await supabase.storage
        .from('uploads')
        .createSignedUrl(input.referenceVideoPath, 3600);
      console.log(`[GENERATE] referenceVideoPath signed URL created in ${Date.now() - tUrl}ms`);
      inputUrls.referenceVideoUrl = signedUrl?.signedUrl;
    }
    if (input?.endFramePath) {
      const tUrl = Date.now();
      const { data: signedUrl } = await supabase.storage
        .from('uploads')
        .createSignedUrl(input.endFramePath, 3600);
      console.log(`[GENERATE] endFramePath signed URL created in ${Date.now() - tUrl}ms`);
      inputUrls.endFrameUrl = signedUrl?.signedUrl;
    }
    if (input?.audioPath) {
      const tUrl = Date.now();
      const { data: signedUrl } = await supabase.storage
        .from('uploads')
        .createSignedUrl(input.audioPath, 3600);
      console.log(`[GENERATE] audioPath signed URL created in ${Date.now() - tUrl}ms`);
      inputUrls.audioUrl = signedUrl?.signedUrl;
    }
    const urlsDuration = Date.now() - tUrls;
    console.log(`[GENERATE] [STEP 11] AFTER all signed URLs created in ${urlsDuration}ms`);

    // Step 12: Call KIE.ai API to create task
    const tKie = Date.now();
    console.log(`[GENERATE] [STEP 12] BEFORE kieGenerate call at ${tKie - t0}ms`);

    // Extract model metadata from capabilities
    const capabilities = model.capabilities || {};
    const modelIdentifier = capabilities.model_identifier || model.key; // Use model_identifier from DB, fallback to key
    const apiFamily = capabilities.family || 'market'; // Default to market API

    // Safe logging (never log secrets)
    console.log(`[GENERATE] Model key from DB: ${model.key}`);
    console.log(`[GENERATE] Model identifier for KIE: ${modelIdentifier}`);
    console.log(`[GENERATE] API family: ${apiFamily}`);
    console.log(`[GENERATE] Modality: ${preset.type}`);
    console.log(`[GENERATE] Has input URLs: ${Object.keys(inputUrls).length > 0}`);

    // Import getKieEndpoints for endpoint selection
    const { getKieEndpoints } = await import('../_shared/providers/kie-endpoints.ts');
    const endpoints = getKieEndpoints(apiFamily as any);
    console.log(`[GENERATE] KIE create endpoint path: ${endpoints.createPath}`);
    console.log(`[GENERATE] KIE status endpoint path: ${endpoints.statusPath}`);

    let providerResult;
    try {
      const providerPayload: ProviderGeneratePayload = {
        modelKey: modelIdentifier, // Use model_identifier from DB (exact KIE identifier)
        prompt,
        modality: preset.type as 'image' | 'video' | 'edit' | 'audio',
        input: {
          ...inputUrls,
          params: input?.params,
        },
        // Pass endpoint config for different API families
        endpointPath: endpoints.createPath,
        apiFamily: apiFamily as any,
      };

      providerResult = await kieGenerate(providerPayload);

      const kieDuration = Date.now() - tKie;
      console.log(`[GENERATE] [STEP 12] AFTER kieGenerate completed in ${kieDuration}ms`);
      // Safe logging
      console.log(`[GENERATE] Provider task created: taskId=${providerResult.taskId}, status=${providerResult.status}`);

      // Return response immediately after getting task ID
      // Update DB records in background (fire-and-forget)
      const responseData = {
        generationId: generation.id,
        status: providerResult.status === 'queued' ? 'queued' : 'processing',
        providerTaskId: providerResult.taskId,
      };

      // Update DB in background (don't await)
      (async () => {
        try {
          const tUpdate = Date.now();
          console.log(`[GENERATE] [BG] Updating generation record at ${tUpdate - t0}ms`);
          await supabase
            .from('generations')
            .update({
              provider_task_id: providerResult.taskId,
              status: providerResult.status === 'queued' ? 'queued' : 'processing',
            })
            .eq('id', generation.id);
          console.log(`[GENERATE] [BG] Generation updated in ${Date.now() - tUpdate}ms`);

          const tProviderTask = Date.now();
          console.log(`[GENERATE] [BG] Creating provider_tasks record at ${tProviderTask - t0}ms`);
          await supabase
            .from('provider_tasks')
            .insert({
              generation_id: generation.id,
              provider: 'kie',
              task_id: providerResult.taskId,
              status: providerResult.status,
              raw: providerResult as any,
            });
          console.log(`[GENERATE] [BG] Provider task created in ${Date.now() - tProviderTask}ms`);
        } catch (bgError) {
          console.error(`[GENERATE] [BG] Error updating DB:`, bgError);
        }
      })();

      const totalDuration = Date.now() - t0;
      console.log(`[GENERATE] Returning response after ${totalDuration}ms`);
      return json(responseData, 200);
    } catch (providerError: any) {
      const kieDuration = Date.now() - tKie;
      console.error(`[GENERATE] [STEP 12] Provider error after ${kieDuration}ms:`, providerError);

      // Refund credits and mark as failed
      if (generation && user) {
        console.log(`[GENERATE] Refunding credits for generation ${generation.id}`);
        try {
          await refundCredits(user.id, generation.id, { reason: 'provider_error' });
          console.log(`[GENERATE] Credits refunded successfully`);
        } catch (refundError) {
          console.error(`[GENERATE] Error refunding credits:`, refundError);
        }

        try {
          await supabase
            .from('generations')
            .update({
              status: 'failed',
              error: { message: providerError instanceof Error ? providerError.message : 'Provider error' },
            })
            .eq('id', generation.id);
        } catch (updateError) {
          console.error(`[GENERATE] Error updating generation status:`, updateError);
        }
      }

      const errorMessage = providerError instanceof Error ? providerError.message : 'Unknown provider error';

      // Detect 422 "model not supported" error
      // Check if error has code property (from kie-client structured error)
      const errorCode = (providerError as any)?.code;
      const is422ModelError = errorCode === 422 ||
        (errorMessage.includes('422') &&
         (errorMessage.toLowerCase().includes('model') || errorMessage.toLowerCase().includes('not supported')));

      // Use already computed modelIdentifier from above
      // Also check if error has modelSent from kie-client
      const modelSent = (providerError as any)?.modelSent || modelIdentifier;

      if (is422ModelError) {
        console.error(`[GENERATE] KIE returned 422 - model not supported`);
        console.error(`[GENERATE] modelKey from DB: ${model.key}`);
        console.error(`[GENERATE] modelIdentifier sent to KIE: ${modelSent}`);
        console.error(`[GENERATE] API family: ${apiFamily}`);
        console.error(`[GENERATE] Endpoint used: ${endpoints.createPath}`);

        const docsUrl = capabilities.docs_url || `https://docs.kie.ai/market`;

        return json({
          error: 'Provider error',
          provider: 'kie',
          code: 422,
          message: errorMessage,
          modelSent: modelSent,
          modelKey: model.key,
          apiFamily: apiFamily,
          endpointPath: endpoints.createPath,
          docsUrl: docsUrl,
          hint: `Модель "${modelSent}" не поддерживается. Проверь: 1) model_identifier в БД (${model.key}) соответствует идентификатору из KIE docs, 2) API family (${apiFamily}) правильный, 3) доступность модели на ${docsUrl}, 4) права API ключа на https://kie.ai/api-key`,
        }, 502); // Return 502 (Bad Gateway) as it's a provider error, not client error
      }

      const statusCode = errorMessage.includes('timeout') ? 504 : 502;

      // Detect if error contains HTML (wrong endpoint)
      const isHtmlError = errorMessage.includes('HTML') || errorMessage.includes('<!DOCTYPE');
      const errorSnippet = errorMessage.length > 200 ? errorMessage.substring(0, 200) + '...' : errorMessage;

      return json({
        error: 'Provider error',
        provider: 'kie',
        message: errorMessage,
        provider_body_snippet: isHtmlError ? errorSnippet : undefined,
      }, statusCode);
    }
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error';

    // Handle secret validation errors
    if (errorMsg.includes('Missing secret: SERVICE_ROLE_KEY')) {
      return json({ error: 'Missing secret: SERVICE_ROLE_KEY' }, 500);
    }
    if (errorMsg.includes('Missing env: SUPABASE_URL')) {
      return json({ error: 'Missing env: SUPABASE_URL' }, 500);
    }
    if (errorMsg.includes('Missing secret: KIE_API_KEY')) {
      return json({ error: 'Missing secret: KIE_API_KEY' }, 500);
    }

    console.error('Generate function error:', error);
    return json({
      error: 'Internal server error',
      message: errorMsg,
    }, 500);
  }
});
