// Shared utilities for status function (embedded for Dashboard deployment)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
export const statusSchema = z.object({
  generationId: z.string().uuid(),
});

// Provider types
export type ProviderStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

export interface ProviderStatusResult {
  status: ProviderStatus;
  progress?: number;
  outputUrl?: string;
  error?: string;
  raw: Record<string, any>;
}

export function mapProviderStatus(providerStatus: string): ProviderStatus {
  const statusLower = providerStatus.toLowerCase();
  if (statusLower.includes('queue') || statusLower.includes('pending')) return 'queued';
  if (statusLower.includes('process') || statusLower.includes('generating') || statusLower.includes('running')) return 'processing';
  if (statusLower.includes('succeed') || statusLower.includes('complete') || statusLower.includes('done')) return 'succeeded';
  if (statusLower.includes('fail') || statusLower.includes('error')) return 'failed';
  return 'processing';
}

// KIE Provider
export async function kieStatus(taskId: string): Promise<ProviderStatusResult> {
  const KIE_BASE_URL = Deno.env.get('KIE_BASE_URL') ?? 'https://api.kie.ai/v1';
  const KIE_API_KEY = Deno.env.get('KIE_API_KEY');
  if (!KIE_API_KEY) throw new Error('Missing secret: KIE_API_KEY');

  try {
    const response = await fetch(`${KIE_BASE_URL}/tasks/${taskId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${KIE_API_KEY}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`KIE API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const status = mapProviderStatus(data.status || 'processing');
    const outputUrl = data.output_url || data.outputUrl || data.result_url || data.resultUrl;

    return {
      status,
      progress: data.progress || data.percent_complete,
      outputUrl: outputUrl ? String(outputUrl) : undefined,
      error: data.error || data.error_message,
      raw: data,
    };
  } catch (error) {
    console.error('KIE status error:', error);
    throw error;
  }
}

// Credits
export async function finalizeCredits(
  ownerId: string,
  generationId: string,
  finalAmount: number,
  meta: Record<string, any> = {}
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('rpc_credit_finalize', {
    p_owner_id: ownerId,
    p_generation_id: generationId,
    p_final_amount: finalAmount,
    p_meta: meta,
  });
  if (error) {
    console.error('Error finalizing credits:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function refundCredits(
  ownerId: string,
  generationId: string,
  meta: Record<string, any> = {}
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('rpc_credit_refund', {
    p_owner_id: ownerId,
    p_generation_id: generationId,
    p_meta: meta,
  });
  if (error) {
    console.error('Error refunding credits:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
