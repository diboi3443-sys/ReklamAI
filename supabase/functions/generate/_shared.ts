// Shared utilities for generate function (embedded for Dashboard deployment)
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
export const generateSchema = z.object({
  boardId: z.string().uuid().optional().nullable(),
  presetKey: z.string(),
  modelKey: z.string(),
  prompt: z.string().min(1),
  input: z.object({
    startFramePath: z.string().optional(),
    endFramePath: z.string().optional(),
    referenceImagePath: z.string().optional(),
    referenceVideoPath: z.string().optional(),
    params: z.record(z.any()).optional(),
  }).optional(),
});

// Provider types
export type ProviderStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

export interface ProviderGenerateResult {
  taskId: string;
  status: ProviderStatus;
  message?: string;
}

export interface ProviderGeneratePayload {
  modelKey: string;
  prompt: string;
  modality: 'image' | 'video' | 'edit' | 'audio';
  input?: {
    startFrameUrl?: string;
    endFrameUrl?: string;
    referenceImageUrl?: string;
    referenceVideoUrl?: string;
    params?: Record<string, any>;
  };
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
export async function kieGenerate(payload: ProviderGeneratePayload): Promise<ProviderGenerateResult> {
  const KIE_BASE_URL = Deno.env.get('KIE_BASE_URL') ?? 'https://api.kie.ai/v1';
  const KIE_API_KEY = Deno.env.get('KIE_API_KEY');
  if (!KIE_API_KEY) throw new Error('Missing secret: KIE_API_KEY');

  let endpoint = '';
  let requestBody: any = { model: payload.modelKey, prompt: payload.prompt };

  if (payload.modality === 'image') {
    endpoint = '/images/generations';
    if (payload.input?.referenceImageUrl) requestBody.image = payload.input.referenceImageUrl;
  } else if (payload.modality === 'video') {
    endpoint = '/videos/generations';
    if (payload.input?.startFrameUrl) requestBody.start_frame = payload.input.startFrameUrl;
    if (payload.input?.referenceImageUrl) requestBody.reference_image = payload.input.referenceImageUrl;
    if (payload.input?.referenceVideoUrl) requestBody.reference_video = payload.input.referenceVideoUrl;
  } else if (payload.modality === 'edit') {
    endpoint = '/images/edit';
    if (payload.input?.referenceImageUrl) requestBody.image = payload.input.referenceImageUrl;
  }

  if (payload.input?.params) requestBody = { ...requestBody, ...payload.input.params };

  try {
    const response = await fetch(`${KIE_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${KIE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`KIE API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const taskId = data.id || data.task_id || data.taskId || data.job_id;
    if (!taskId) throw new Error('No task ID returned from KIE API');

    return {
      taskId: String(taskId),
      status: mapProviderStatus(data.status || 'queued'),
      message: data.message,
    };
  } catch (error) {
    console.error('KIE generate error:', error);
    throw error;
  }
}

// Credits
export async function reserveCredits(
  ownerId: string,
  generationId: string,
  amount: number,
  meta: Record<string, any> = {}
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('rpc_credit_reserve', {
    p_owner_id: ownerId,
    p_generation_id: generationId,
    p_amount: amount,
    p_meta: meta,
  });
  if (error) {
    console.error('Error reserving credits:', error);
    return { success: false, error: error.message };
  }
  if (data === false) return { success: false, error: 'Insufficient credits' };
  return { success: true };
}

export async function estimateCredits(
  presetDefaults: any,
  modelPriceMultiplier: number,
  markupPercent: number
): Promise<number> {
  const baseCredits = presetDefaults?.credits || 1;
  const withMultiplier = baseCredits * modelPriceMultiplier;
  const withMarkup = withMultiplier * (1 + markupPercent / 100);
  return Math.ceil(withMarkup * 100) / 100;
}
