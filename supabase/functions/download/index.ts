// Download Edge Function: Returns signed URL for generation output
// For CLI deployment: use ../_shared/ imports (CLI handles this correctly)
import { corsHeaders } from '../_shared/cors.ts';
import { createAuthedUserClient } from '../_shared/auth.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { downloadSchema } from '../_shared/validation.ts';
import { KieClient } from '../_shared/providers/kie-client.ts';

// Helper to create JSON response with CORS headers
function json(data: any, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// Main handler
Deno.serve(async (req: Request): Promise<Response> => {
  const method = req.method;
  
  // Handle CORS preflight (OPTIONS)
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Handle non-POST methods
  if (method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabase = createServiceClient();
    // Authenticate user
    const authResult = await createAuthedUserClient(req);
    if (!authResult) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { user } = authResult;

    // Parse request body
    const body = await req.json();
    const validationResult = downloadSchema.safeParse(body);
    if (!validationResult.success) {
      return json({ error: 'Invalid payload', details: validationResult.error }, 400);
    }

    const { generationId } = validationResult.data;

    // Verify ownership and load generation
    const { data: generation, error: genError } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .eq('owner_id', user.id)
      .single();

    if (genError || !generation) {
      return json({ error: 'Generation not found or access denied' }, 404);
    }

    // Check if output asset exists
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('storage_bucket, storage_path, provider_url')
      .eq('generation_id', generationId)
      .eq('kind', 'output')
      .single();

    if (asset && !assetError) {
      // Create signed URL from storage
      const { data: signedUrl, error: urlError } = await supabase.storage
        .from(asset.storage_bucket)
        .createSignedUrl(asset.storage_path, 3600); // 1 hour expiry

      if (!urlError && signedUrl) {
        return json({
          url: signedUrl.signedUrl,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        }, 200);
      }
    }

    // Fallback: fetch from KIE.ai and store in outputs bucket
    if (generation.status === 'succeeded' && generation.provider_task_id) {
      try {
        const kieClient = new KieClient();
        const downloadUrl = await kieClient.getDownloadUrl(generation.provider_task_id);

        // Download the file from KIE.ai
        const fileResponse = await fetch(downloadUrl);
        if (!fileResponse.ok) {
          throw new Error(`Failed to download from KIE.ai: ${fileResponse.status}`);
        }

        const fileBlob = await fileResponse.blob();
        const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
        const fileExt = contentType.includes('video') ? 'mp4' : 
                       contentType.includes('image') ? 'png' : 
                       contentType.includes('audio') ? 'mp3' : 'bin';
        const storagePath = `${user.id}/${generationId}/result.${fileExt}`;

        // Upload to outputs bucket
        const { error: uploadError } = await supabase.storage
          .from('outputs')
          .upload(storagePath, fileBlob, {
            contentType,
            upsert: true,
          });

        if (!uploadError) {
          // Create or update asset record
          const { data: existingAsset } = await supabase
            .from('assets')
            .select('id')
            .eq('generation_id', generationId)
            .eq('kind', 'output')
            .single();

          if (existingAsset) {
            await supabase
              .from('assets')
              .update({
                storage_bucket: 'outputs',
                storage_path: storagePath,
                provider_url: downloadUrl,
                meta: { contentType, size: fileBlob.size },
              })
              .eq('id', existingAsset.id);
          } else {
            await supabase.from('assets').insert({
              generation_id: generationId,
              owner_id: user.id,
              kind: 'output',
              storage_bucket: 'outputs',
              storage_path: storagePath,
              provider_url: downloadUrl,
              meta: { contentType, size: fileBlob.size },
            });
          }

          // Create signed URL
          const { data: signedUrl, error: urlError } = await supabase.storage
            .from('outputs')
            .createSignedUrl(storagePath, 3600); // 1 hour expiry

          if (!urlError && signedUrl) {
            return json({
              url: signedUrl.signedUrl,
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
            }, 200);
          }
        }
      } catch (downloadError) {
        console.error('Error downloading from KIE.ai:', downloadError);
        // Fall through to return error
      }
    }

    return json({ error: 'Output not available' }, 404);
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error';
    
    // Handle secret validation errors
    if (errorMsg.includes('Missing secret: SERVICE_ROLE_KEY')) {
      return json({ error: 'Missing secret: SERVICE_ROLE_KEY' }, 500);
    }
    if (errorMsg.includes('Missing env: SUPABASE_URL')) {
      return json({ error: 'Missing env: SUPABASE_URL' }, 500);
    }
    
    console.error('Download function error:', error);
    return json({
      error: 'Internal server error',
      message: errorMsg,
    }, 500);
  }
});
