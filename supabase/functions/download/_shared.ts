// Shared utilities for download function (embedded for Dashboard deployment)
import { createClient } from '@supabase/supabase-js';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// CORS
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

export function withCors(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }
    try {
      const response = await handler(req);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    } catch (error) {
      console.error('Error in handler:', error);
      const errorResponse = new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      return errorResponse;
    }
  };
}

// Supabase clients
export function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY');
  if (!supabaseUrl) throw new Error('Missing env: SUPABASE_URL');
  if (!supabaseServiceKey) throw new Error('Missing secret: SERVICE_ROLE_KEY');
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createPublicClient(authToken?: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  if (authToken) {
    client.auth.setSession({ access_token: authToken, refresh_token: '' } as any);
  }
  return client;
}

// Auth
export async function createAuthedUserClient(req: Request): Promise<{
  client: ReturnType<typeof createPublicClient>;
  user: { id: string; email?: string };
} | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const client = createPublicClient(token);
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) return null;
  return { client, user: { id: user.id, email: user.email } };
}

// Validation
export const downloadSchema = z.object({
  generationId: z.string().uuid(),
});
