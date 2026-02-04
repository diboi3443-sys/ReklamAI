// Edge Functions API client wrapper
import { getAuthToken, supabase } from './supabase';

// Support both Vite env vars and window.APP_CONFIG
const getSupabaseUrl = (): string => {
  if (import.meta.env.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && (window as any).APP_CONFIG?.VITE_SUPABASE_URL) {
    return (window as any).APP_CONFIG.VITE_SUPABASE_URL.replace(/\/$/, '');
  }
  return '';
};

const EDGE_FUNCTIONS_URL = getSupabaseUrl();
const EDGE_FUNCTIONS_BASE = `${EDGE_FUNCTIONS_URL}/functions/v1`;

export interface UploadFileParams {
  file: File;
  purpose: 'startFrame' | 'endFrame' | 'referenceImage' | 'referenceVideo';
  generationId?: string;
}

export interface UploadFileResponse {
  success: boolean;
  bucket: string;
  path: string;
  generationId: string | null;
  error?: string;
}

export interface GenerateParams {
  boardId?: string | null;
  presetKey: string;
  modelKey: string;
  prompt: string;
  input?: {
    startFramePath?: string;
    endFramePath?: string;
    referenceImagePath?: string;
    referenceVideoPath?: string;
    params?: Record<string, any>;
  };
}

export interface GenerateResponse {
  generationId: string;
  status: string;
  providerTaskId?: string;
  error?: string;
}

export interface StatusResponse {
  status: 'queued' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  progress?: number;
  signedPreviewUrl?: string;
  error?: any;
}

export interface DownloadResponse {
  url: string;
  expiresAt: string | null;
  temporary?: boolean;
  error?: string;
}

async function callEdgeFunction(
  functionName: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<Response> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${EDGE_FUNCTIONS_BASE}/${functionName}`, {
    method: options.method || 'POST',
    headers,
    body: options.body instanceof FormData ? options.body : JSON.stringify(options.body),
  });

  return response;
}

export async function uploadFile(params: UploadFileParams): Promise<UploadFileResponse> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  // Step 1: Request upload path from Edge Function
  const pathResponse = await fetch(`${EDGE_FUNCTIONS_BASE}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      purpose: params.purpose,
      generationId: params.generationId,
      fileName: params.file.name,
      fileSize: params.file.size,
      contentType: params.file.type || 'application/octet-stream',
    }),
  });

  const pathData = await pathResponse.json();

  if (!pathResponse.ok) {
    throw new Error(pathData.error || 'Failed to get upload path');
  }

  // Step 2: Upload file directly to Storage using Supabase client
  // This uses RLS policies, so user can only upload to their own path
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(pathData.path, params.file, {
      contentType: params.file.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload to Storage failed: ${uploadError.message}`);
  }

  // Return the path and metadata
  return {
    success: true,
    bucket: 'uploads',
    path: pathData.path,
    generationId: pathData.generationId || null,
  };
}

export async function generate(params: GenerateParams): Promise<GenerateResponse> {
  const response = await callEdgeFunction('generate', {
    method: 'POST',
    body: params,
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle 402 Payment Required (Insufficient credits)
    if (response.status === 402) {
      const error = new Error(data.error || data.message || 'Insufficient credits');
      (error as any).code = 402;
      (error as any).type = 'insufficient_credits';
      throw error;
    }
    // Handle 502 Bad Gateway (Provider error or timeout)
    if (response.status === 502 || response.status === 504) {
      const error = new Error(
        data.error || data.message || 
        (response.status === 504 ? 'Generation timeout - please try again' : 'Provider error - please try again later')
      );
      (error as any).code = response.status;
      (error as any).type = response.status === 504 ? 'timeout' : 'provider_error';
      (error as any).provider = data.provider;
      (error as any).hint = data.hint;
      throw error;
    }
    // Handle structured 422 error from KIE
    if (response.status === 422 && data.code === 422 && data.provider === 'kie') {
      const error = new Error(data.message || 'Model not supported');
      (error as any).code = 422;
      (error as any).provider = 'kie';
      (error as any).modelSent = data.modelSent;
      (error as any).modelKey = data.modelKey;
      (error as any).hint = data.hint;
      throw error;
    }
    throw new Error(data.error || data.message || 'Generation failed');
  }

  return data;
}

export async function getStatus(generationId: string): Promise<StatusResponse> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${EDGE_FUNCTIONS_BASE}/status?generationId=${generationId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Status check failed');
  }

  return data;
}

export async function download(generationId: string): Promise<DownloadResponse> {
  const response = await callEdgeFunction('download', {
    method: 'POST',
    body: { generationId },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Download failed');
  }

  return data;
}
