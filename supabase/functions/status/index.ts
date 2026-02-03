// Status Edge Function: Polls provider for generation status and updates DB
// For CLI deployment: use ../_shared/ imports (CLI handles this correctly)
import { corsHeaders } from '../_shared/cors.ts';
import { createAuthedUserClient } from '../_shared/auth.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { statusSchema } from '../_shared/validation.ts';
import { finalizeCredits, refundCredits } from '../_shared/credits.ts';
import { kieStatus } from '../_shared/providers/kie.ts';

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

Deno.serve(async (req: Request): Promise<Response> => {
  const t0 = Date.now();
  const method = req.method;
  const url = new URL(req.url);
  const authHeader = req.headers.get('Authorization') || '';

  const isServiceRole = (() => {
    if (!authHeader.startsWith('Bearer ')) return false;
    try {
      const token = authHeader.slice('Bearer '.length).trim();
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const role = payload?.role || payload?.app_metadata?.role;
      return role === 'service_role';
    } catch {
      return false;
    }
  })();

  console.log(`[STATUS] ========================================`);
  console.log(`[STATUS] Request received: ${method} ${url.pathname}${url.search}`);
  console.log(`[STATUS] Headers:`, Object.fromEntries(req.headers.entries()));
  console.log(`[STATUS] isServiceRole=${isServiceRole}`);

  // Handle CORS preflight (OPTIONS) - return immediately
  if (method === 'OPTIONS') {
    console.log(`[STATUS] CORS preflight, returning 204`);
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Handle non-GET/POST methods
  if (method !== 'GET' && method !== 'POST') {
    console.log(`[STATUS] Method not allowed: ${method}`);
    return json({ error: 'Method not allowed' }, 405);
  }

  // Validate KIE secrets (for status function that calls provider)
  const KIE_API_KEY = Deno.env.get('KIE_API_KEY');
  if (!KIE_API_KEY) {
    console.error(`[STATUS] Missing KIE_API_KEY`);
    return json({ error: 'Missing secret: KIE_API_KEY' }, 500);
  }
  console.log(`[STATUS] KIE_API_KEY found, length: ${KIE_API_KEY.length}`);

  try {
    console.log(`[STATUS] Creating service client...`);
    const supabase = createServiceClient();
    let userId: string | null = null;

    if (!isServiceRole) {
      console.log(`[STATUS] Authenticating user...`);
      // Authenticate user
      const authResult = await createAuthedUserClient(req);
      if (!authResult) {
        console.error(`[STATUS] Authentication failed`);
        return json({ error: 'Unauthorized' }, 401);
      }
      userId = authResult.user.id;
      console.log(`[STATUS] Authenticated user: ${userId}`);
    }

    // Parse generation ID from query or body
    let generationId: string;
    if (req.method === 'GET') {
      generationId = url.searchParams.get('generationId') || '';
    } else {
      const body = await req.json();
      generationId = body.generationId || '';
    }

    console.log(`[STATUS] Generation ID: ${generationId}`);

    const validationResult = statusSchema.safeParse({ generationId });
    if (!validationResult.success) {
      return json({ error: 'Invalid payload', details: validationResult.error }, 400);
    }

    // Verify ownership and load generation
    const generationQuery = supabase
      .from('generations')
      .select('*')
      .eq('id', generationId);
    if (!isServiceRole) {
      generationQuery.eq('owner_id', userId);
    }
    const { data: generation, error: genError } = await generationQuery.single();

    if (genError || !generation) {
      return json({ error: 'Generation not found or access denied' }, 404);
    }

    // If no provider task ID, return current status
    if (!generation.provider_task_id) {
      return json({
        status: generation.status,
        progress: generation.status === 'processing' ? 50 : undefined,
      }, 200);
    }

    // Poll provider for status using centralized client
    // Get model key from generation for logging
    let modelKey: string | undefined;
    if (generation.model_id) {
      const { data: model } = await supabase
        .from('models')
        .select('key')
        .eq('id', generation.model_id)
        .single();
      modelKey = model?.key;
    }

    // Safe logging
    console.log(`[STATUS] Polling provider for task: ${generation.provider_task_id}`);
    if (modelKey) {
      console.log(`[STATUS] Model: ${modelKey}`);
    }

    let providerStatus;
    try {
      providerStatus = await kieStatus(generation.provider_task_id, modelKey);

      // Safe logging
      console.log(`[STATUS] Provider status: ${providerStatus.status}, progress: ${providerStatus.progress || 'N/A'}`);

      // Update provider_tasks record
      await supabase
        .from('provider_tasks')
        .update({
          status: providerStatus.status,
          raw: providerStatus.raw,
          updated_at: new Date().toISOString(),
        })
        .eq('generation_id', generationId);
    } catch (providerError: any) {
      console.error('[STATUS] ❌ Provider status error:', providerError);
      console.error('[STATUS] Provider error message:', providerError?.message);
      console.error('[STATUS] Provider error stack:', providerError?.stack);
      // Return current status if provider is unreachable
      return json({
        status: generation.status,
        error: 'Provider unavailable',
        details: providerError?.message || String(providerError),
      }, 200);
    }

    // Map provider status to internal status
    const newStatus = providerStatus.status;

    console.log(`[STATUS] Status check: newStatus='${newStatus}', generation.status='${generation.status}'`);
    console.log(`[STATUS] Condition: newStatus === 'succeeded' = ${newStatus === 'succeeded'}, generation.status !== 'succeeded' = ${generation.status !== 'succeeded'}`);

    // Handle status transitions
    if (newStatus === 'succeeded' && generation.status !== 'succeeded') {
      console.log(`[STATUS] ✅ Entering succeeded block - will download and update`);
      console.log(`[STATUS] providerStatus.outputUrl: ${providerStatus.outputUrl || 'NOT PROVIDED'}`);

      // Download output and save to storage (if URL is provided)
      if (providerStatus.outputUrl) {
        console.log(`[STATUS] Output URL found, downloading: ${providerStatus.outputUrl}`);
        try {
          const outputResponse = await fetch(providerStatus.outputUrl);
          if (outputResponse.ok) {
            const outputBlob = await outputResponse.blob();
            const contentType = outputResponse.headers.get('content-type') || 'application/octet-stream';
            const fileExt = contentType.includes('video') ? 'mp4' : contentType.includes('image') ? 'png' : 'bin';
            const ownerId = userId || generation.owner_id;
            const storagePath = `${ownerId}/${generationId}/result.${fileExt}`;

            // Upload to outputs bucket
            const { error: uploadError } = await supabase.storage
              .from('outputs')
              .upload(storagePath, outputBlob, {
                contentType,
                upsert: true,
              });

            if (!uploadError) {
              // Create asset record
              console.log(`[STATUS] Creating asset record for generation ${generationId}`);
              const assetType = contentType.includes('video') ? 'video' : 'image';
              console.log(`[STATUS] Asset data:`, {
                generation_id: generationId,
                owner_id: ownerId,
                kind: 'output',
                asset_type: assetType,
                storage_bucket: 'outputs',
                storage_path: storagePath,
                provider_url: providerStatus.outputUrl,
                meta: { contentType, size: outputBlob.size },
              });

              const { data: assetData, error: assetError } = await supabase
                .from('assets')
                .insert({
                  generation_id: generationId,
                  owner_id: ownerId,
                  kind: 'output',
                  asset_type: contentType.includes('video') ? 'video' : 'image',
                  storage_bucket: 'outputs',
                  storage_path: storagePath,
                  provider_url: providerStatus.outputUrl,
                  meta: { contentType, size: outputBlob.size },
                })
                .select()
                .single();

              if (assetError) {
                console.error(`[STATUS] ❌ Failed to create asset record:`, assetError);
                console.error(`[STATUS] Error code: ${assetError.code}, message: ${assetError.message}`);
                console.error(`[STATUS] Error details:`, JSON.stringify(assetError, null, 2));
                // Continue anyway - generation is succeeded, just log the error
              } else {
                console.log(`[STATUS] ✅ Asset record created successfully:`, assetData?.id);
              }

              // Finalize credits
              const finalCredits = generation.reserved_credits || generation.estimated_credits || 0;
              console.log(`[STATUS] Finalizing credits: ${finalCredits} for generation ${generationId}`);

              try {
                await finalizeCredits(ownerId, generationId, finalCredits, {
                  preset_id: generation.preset_id,
                  model_id: generation.model_id,
                });
                console.log(`[STATUS] ✅ Credits finalized successfully`);
              } catch (creditError) {
                console.error(`[STATUS] ⚠️ Credits finalization failed:`, creditError);
                // Continue anyway - don't block status update
              }

              // Update generation status to succeeded
              console.log(`[STATUS] Updating generation ${generationId} status to 'succeeded'...`);
              console.log(`[STATUS] Update payload:`, { status: 'succeeded', generation_id: generationId });

              const { data: updateData, error: updateError, count } = await supabase
                .from('generations')
                .update({
                  status: 'succeeded',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', generationId)
                .select();

              console.log(`[STATUS] Update result - count: ${count}, data length: ${updateData?.length}, error: ${!!updateError}`);

              if (updateError) {
                console.error(`[STATUS] ❌ Failed to update generation status:`, updateError);
                console.error(`[STATUS] Update error code: ${updateError.code}, message: ${updateError.message}`);
                console.error(`[STATUS] Full error:`, JSON.stringify(updateError));
              } else if (!updateData || updateData.length === 0) {
                console.error(`[STATUS] ❌ Update returned 0 rows - RLS may be blocking!`);
                console.error(`[STATUS] generationId: ${generationId}, service client should bypass RLS`);
              } else {
                console.log(`[STATUS] ✅ Generation status updated to 'succeeded':`, updateData[0]?.status);
              }
            } else {
              // Upload failed, but still try to update status
              console.error(`[STATUS] ❌ Upload failed:`, uploadError);
              console.log(`[STATUS] Updating generation ${generationId} status to 'succeeded' despite upload error...`);
              const { data: updateData2, error: updateError2 } = await supabase
                .from('generations')
                .update({
                  status: 'succeeded',
                  error: { message: 'Output upload failed', details: uploadError },
                  updated_at: new Date().toISOString(),
                })
                .eq('id', generationId)
                .select();

              console.log(`[STATUS] Update (upload error case) result - data length: ${updateData2?.length}, error: ${!!updateError2}`);

              if (updateError2) {
                console.error(`[STATUS] ❌ Failed to update generation status:`, updateError2);
              } else if (!updateData2 || updateData2.length === 0) {
                console.error(`[STATUS] ❌ Update returned 0 rows (upload error case) - RLS may be blocking!`);
              } else {
                console.log(`[STATUS] ✅ Generation status updated to 'succeeded' (with upload error)`);
              }
            }
          }
        } catch (downloadError) {
          console.error('Error downloading output:', downloadError);
          // Still mark as succeeded but log error
          const { data: updateData3, error: updateError3 } = await supabase
            .from('generations')
            .update({
              status: 'succeeded',
              error: { message: 'Output download failed', details: String(downloadError) },
              updated_at: new Date().toISOString(),
            })
            .eq('id', generationId)
            .select();

          console.log(`[STATUS] Update (download error case) result - data length: ${updateData3?.length}, error: ${!!updateError3}`);
        }
      } else {
        // No outputUrl provided, but status is succeeded - update status anyway
        console.log(`[STATUS] ⚠️ No output URL provided, but status is succeeded - updating status without asset`);
        const ownerId = userId || generation.owner_id;
        const finalCredits = generation.reserved_credits || generation.estimated_credits || 0;

        const { data: updateData4, error: updateError4 } = await supabase
          .from('generations')
          .update({
            status: 'succeeded',
            updated_at: new Date().toISOString(),
          })
          .eq('id', generationId)
          .select();

        console.log(`[STATUS] Update (no outputUrl case) result - data length: ${updateData4?.length}, error: ${!!updateError4}`);

        if (updateError4) {
          console.error(`[STATUS] ❌ Failed to update generation status (no outputUrl):`, updateError4);
        } else if (!updateData4 || updateData4.length === 0) {
          console.error(`[STATUS] ❌ Update returned 0 rows (no outputUrl) - RLS may be blocking!`);
        } else {
          console.log(`[STATUS] ✅ Generation status updated to 'succeeded' (no output URL)`);
        }
      }
    } else if (newStatus === 'failed' && generation.status !== 'failed') {
      // Refund credits
      const ownerId = userId || generation.owner_id;
      await refundCredits(ownerId, generationId, {
        provider_error: providerStatus.error || 'Unknown error',
      });

      // Update generation
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error: { message: providerStatus.error || 'Generation failed', raw: providerStatus.raw },
          updated_at: new Date().toISOString(),
        })
        .eq('id', generationId);
    } else if (newStatus !== generation.status && newStatus !== 'succeeded' && newStatus !== 'failed') {
      // Update status for queued/processing
      await supabase
        .from('generations')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', generationId);
    }

    // Get updated generation
    const { data: updatedGeneration } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .single();

    // Create signed URL for preview if output exists
    let signedPreviewUrl: string | undefined;
    if (updatedGeneration?.status === 'succeeded') {
      const { data: asset } = await supabase
        .from('assets')
        .select('storage_bucket, storage_path')
        .eq('generation_id', generationId)
        .eq('kind', 'output')
        .single();

      if (asset) {
        const { data: signedUrl } = await supabase.storage
          .from(asset.storage_bucket)
          .createSignedUrl(asset.storage_path, 3600); // 1 hour expiry
        signedPreviewUrl = signedUrl?.signedUrl;
      }
    }

    return json({
      status: updatedGeneration?.status || newStatus,
      progress: providerStatus.progress,
      signedPreviewUrl,
      error: updatedGeneration?.error || providerStatus.error,
    }, 200);
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

    console.error('Status function error:', error);
    return json({
      error: 'Internal server error',
      message: errorMsg,
    }, 500);
  }
});
