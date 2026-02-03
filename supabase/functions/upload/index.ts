// Upload Edge Function: Generates signed URL for direct upload to Storage
// This avoids CORS preflight issues by using signed URLs instead of direct file upload through Edge Function

import { getUserFromJwtOrNull } from '../_shared/auth.ts';
import { uploadSchema } from '../_shared/validation.ts';

// CORS headers - must be set on all responses
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Expected issuer for JWT validation (derived from SUPABASE_URL)
function getExpectedIss(): string {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!supabaseUrl) {
    throw new Error('Missing env: SUPABASE_URL');
  }
  // Extract base URL and construct auth issuer
  const url = new URL(supabaseUrl);
  return `${url.protocol}//${url.host}/auth/v1`;
}

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
  
  console.log(`[UPLOAD] start method=${method}`);
  
  // 1) Handle CORS preflight (OPTIONS) - return immediately, NO auth required
  if (method === 'OPTIONS') {
    const duration = Date.now() - t0;
    console.log(`[UPLOAD] preflight handled in ${duration}ms`);
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // 2) Handle non-POST methods - return 405 immediately, NO auth required
  if (method !== 'POST') {
    const duration = Date.now() - t0;
    console.log(`[UPLOAD] method not allowed: ${method} (returning 405 in ${duration}ms)`);
    return json(
      { error: 'Method Not Allowed', allowed: ['POST'] },
      405
    );
  }

  // 3) From here on - only POST requests
  // Extract Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const duration = Date.now() - t0;
    console.log(`[UPLOAD] No Authorization header (returning 401 in ${duration}ms)`);
    return json(
      { code: 401, message: 'Unauthorized: Missing or invalid Authorization header' },
      401
    );
  }

  // 4) Extract token and validate JWT (decode only, no network calls)
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    const duration = Date.now() - t0;
    console.log(`[UPLOAD] Empty token (returning 401 in ${duration}ms)`);
    return json(
      { code: 401, message: 'Unauthorized: Empty token' },
      401
    );
  }

  try {
    // Validate environment variables early
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      const duration = Date.now() - t0;
      console.error(`[UPLOAD] Missing SUPABASE_URL after ${duration}ms`);
      return json(
        { error: 'Server configuration error: Missing SUPABASE_URL environment variable' },
        500
      );
    }

    // Extract user ID from JWT payload (fast, no network)
    // Validate exp (expiration) and iss (issuer) strictly
    const expectedIss = getExpectedIss();
    console.log(`[UPLOAD] Expected issuer: ${expectedIss}`);
    console.log(`[UPLOAD] Token length: ${token.length}, first 20 chars: ${token.substring(0, 20)}...`);
    
    const userInfo = getUserFromJwtOrNull(token, expectedIss);
    if (!userInfo) {
      const duration = Date.now() - t0;
      console.error(`[UPLOAD] Invalid JWT (returning 401 in ${duration}ms)`);
      console.error(`[UPLOAD] Check logs above for JWT decode/validation errors`);
      return json(
        { 
          code: 401, 
          message: 'Invalid JWT or authentication failed',
          hint: 'Check function logs for details (iss mismatch, expired, or decode error)'
        },
        401
      );
    }

    console.log(`[AUTH] ok sub=${userInfo.id}`);
    const userId = userInfo.id;

    // Note: We don't need to create a service client here since we're only
    // returning a path for client-side upload. The actual upload will be done
    // by the client using Supabase Storage client with RLS policies.

    // 5) Parse request body (JSON with file metadata)
    const tParse = Date.now();
    console.log(`[UPLOAD] parsing body start at ${tParse - t0}ms`);
    
    let body: any;
    try {
      body = await req.json();
    } catch (parseError: any) {
      const duration = Date.now() - t0;
      console.error(`[UPLOAD] JSON parse error after ${duration}ms: ${parseError.message}`);
      return json(
        { error: 'Failed to parse JSON body', details: parseError.message },
        400
      );
    }
    
    const parseDuration = Date.now() - tParse;
    console.log(`[UPLOAD] body parsed in ${parseDuration}ms`);

    const { purpose, generationId, fileName, fileSize, contentType } = body;

    // Validate purpose
    const validationResult = uploadSchema.safeParse({ purpose, generationId });
    if (!validationResult.success) {
      const duration = Date.now() - t0;
      console.log(`[UPLOAD] Validation failed (returning 400 in ${duration}ms)`);
      return json(
        {
          error: 'Invalid payload',
          details: validationResult.error.format(),
        },
        400
      );
    }

    // Validate file metadata
    if (!fileName || typeof fileName !== 'string') {
      return json(
        { error: 'Missing or invalid fileName' },
        400
      );
    }

    if (!fileSize || typeof fileSize !== 'number' || fileSize <= 0) {
      return json(
        { error: 'Missing or invalid fileSize' },
        400
      );
    }

    // Maximum file size: 10MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (fileSize > MAX_FILE_SIZE) {
      const sizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      console.log(`[UPLOAD] File too large: ${sizeMB}MB (max: 10MB) - returning 413`);
      return json(
        {
          error: 'File too large',
          size: fileSize,
          max_size: MAX_FILE_SIZE,
          size_mb: sizeMB,
        },
        413
      );
    }

    // 6) Generate storage path
    const fileExt = fileName.split('.').pop() || 'bin';
    // Sanitize filename - remove special characters
    const safeFilename = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${safeFilename}`;
    
    const storagePath = generationId
      ? `${userId}/${generationId}/${purpose}.${fileExt}`
      : `${userId}/${purpose}/${uniqueFileName}`;

    // 7) Return storage path for client-side upload
    // Since Supabase Storage API doesn't have createSignedUploadUrl,
    // we'll return the path and let the client upload directly using Storage client
    // The client will use Supabase Storage client with RLS policies
    
    const tUrl = Date.now();
    console.log(`[UPLOAD] generating upload info at ${tUrl - t0}ms, path: ${storagePath}`);
    
    const urlDuration = Date.now() - tUrl;
    const totalDuration = Date.now() - t0;

    console.log(`[UPLOAD] upload info generated ok, duration=${urlDuration}ms, total=${totalDuration}ms`);
    
    return json(
      {
        success: true,
        path: storagePath,
        bucket: 'uploads',
        generationId: generationId || null,
        file_name: fileName,
        file_size: fileSize,
        content_type: contentType || 'application/octet-stream',
      },
      200
    );
  } catch (error: any) {
    const duration = Date.now() - t0;
    const errorMsg = error?.message || 'Unknown error';
    
    console.error(`[UPLOAD] Exception after ${duration}ms:`, errorMsg, error?.stack);
    
    // Handle secret validation errors (fast response)
    if (errorMsg.includes('Missing secret: SERVICE_ROLE_KEY')) {
      return json(
        { error: 'Server configuration error: Missing SERVICE_ROLE_KEY secret' },
        500
      );
    }
    
    if (errorMsg.includes('Missing env: SUPABASE_URL')) {
      return json(
        { error: 'Server configuration error: Missing SUPABASE_URL environment variable' },
        500
      );
    }
    
    // Generic error response
    return json(
      {
        error: 'Internal server error',
        message: errorMsg,
      },
      500
    );
  }
});
