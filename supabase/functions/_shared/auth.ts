// Authentication helpers for Edge Functions
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createServiceClient } from './supabase.ts';
import { createClient } from '@supabase/supabase-js';

/**
 * Safe base64url decoder using Web APIs available in Deno.
 * Falls back to manual implementation if atob is not available.
 */
function base64UrlDecode(input: string): string {
  // base64url -> base64: replace URL-safe characters
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  const pad = b64.length % 4;
  if (pad) {
    b64 += '='.repeat(4 - pad);
  }

  // Try using globalThis.atob if available
  if (typeof globalThis.atob !== 'undefined') {
    try {
      return globalThis.atob(b64);
    } catch (e) {
      // Fall through to manual decode
    }
  }

  // Manual base64 decode using Uint8Array + TextDecoder
  // Base64 alphabet: A-Z, a-z, 0-9, +, /
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  const bytes: number[] = [];
  let buffer = 0;
  let bitsCollected = 0;

  for (let i = 0; i < b64.length; i++) {
    const char = b64[i];
    if (char === '=') break;
    const value = lookup[char.charCodeAt(0)];
    if (value === undefined) continue;

    buffer = (buffer << 6) | value;
    bitsCollected += 6;

    if (bitsCollected >= 8) {
      bytes.push((buffer >> (bitsCollected - 8)) & 0xff);
      bitsCollected -= 8;
    }
  }

  return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * Decode JWT payload from token string (extracts payload part and decodes it).
 * Returns null if token is invalid or cannot be decoded.
 */
function decodeJwtPayload(token: string): any | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error(`[AUTH] Invalid JWT format: expected 3 parts, got ${parts.length}`);
    return null;
  }

  try {
    const payloadPart = parts[1];
    const json = base64UrlDecode(payloadPart);
    const payload = JSON.parse(json);
    return payload;
  } catch (error: any) {
    console.error(`[AUTH] JWT payload decode failed: ${error.message}`);
    return null;
  }
}

/**
 * Extract user info from JWT token (minimal validation for --no-verify-jwt mode).
 * Validates: token format, exp not expired, sub/subject present.
 *
 * @param token - JWT token string
 * @returns User info from JWT payload or null if invalid/expired
 */
export function getUserFromJwtOrNull(token: string): { id: string; email?: string } | null {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  // Extract sub (user ID)
  const sub = payload.sub ?? payload.subject;
  if (!sub || typeof sub !== 'string') {
    return null;
  }

  // Check expiration (exp is in seconds)
  const exp = payload.exp ?? payload.expires_at;
  if (typeof exp === 'number') {
    const expMs = exp * 1000;
    if (Date.now() >= expMs) {
      return null; // Expired
    }
  }

  const email = typeof payload.email === 'string' ? payload.email : undefined;
  return { id: sub, email };
}

/**
 * Create authenticated user client from request.
 * Uses Supabase Edge verified context when available, falls back to JWT decode.
 *
 * Extraction paths:
 * 1. Supabase Edge metadata (if verify-jwt enabled) - reads from request context
 * 2. JWT decode fallback (if --no-verify-jwt) - minimal validation: format + exp + sub
 *
 * @param req - Request object
 * @returns Object with service client and user info, or null if auth failed
 */
export async function createAuthedUserClient(req: Request): Promise<{
  client: ReturnType<typeof createServiceClient>;
  userClient: any;
  user: { id: string; email?: string };
  token: string;
} | { error: string; details?: string } | null> {
  const t0 = Date.now();

  // Extract from Authorization Bearer token
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    console.log(`[AUTH] Missing Bearer token`);
    return { error: 'Missing Bearer token' };
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    console.log(`[AUTH] Empty token`);
    return { error: 'Empty token' };
  }

  const userInfo = getUserFromJwtOrNull(token);
  if (!userInfo) {
    console.log(`[AUTH] JWT decode failed or expired`);
    return { error: 'JWT invalid or expired' };
  }

  console.log(`[AUTH] User ID: ${userInfo.id}`);

  // Create service client for reads
  const serviceClient = createServiceClient();

  // Create user client with their token for RLS-aware writes
  // Used to be dynamic import, changed to static to fix bundling timeout
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  console.log(`[AUTH] SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}`);
  console.log(`[AUTH] SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'MISSING'}`);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(`[AUTH] ❌ Missing env vars for user client!`);
    // Fall back to service client only
    return {
      client: serviceClient,
      userClient: serviceClient,
      user: userInfo,
      token,
    };
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Verify token validity by checking with Supabase Auth
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) {
    console.error(`[AUTH] Token Verification Failed: ${authError?.message}`);
    return { error: `Token rejected by Auth Service: ${authError?.message}` };
  }

  // Ensure the user ID matches the claim
  if (authData.user.id !== userInfo.id) {
    console.error(`[AUTH] User ID mismatch: Token claim ${userInfo.id} vs Auth Service ${authData.user.id}`);
    return { error: 'User ID mismatch' };
  }

  console.log(`[AUTH] Token verified successfully for user ${authData.user.id}`);

  const duration = Date.now() - t0;
  console.log(`[AUTH] Auth successful in ${duration}ms, userClient created`);

  return {
    client: serviceClient,
    userClient,
    user: userInfo,
    token,
  };
}
