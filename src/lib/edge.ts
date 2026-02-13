/**
 * ReklamAI v2.0 — Edge Functions / API wrapper
 * Now talks to FastAPI backend instead of Supabase Edge Functions.
 */
import { apiFetch, getToken, clearToken } from './api';

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

/**
 * Upload a file to the backend.
 */
export async function uploadFile(params: UploadFileParams): Promise<UploadFileResponse> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('purpose', params.purpose);

  const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    return {
      success: false,
      bucket: '',
      path: '',
      generationId: null,
      error: body.detail || `Upload failed: ${res.status}`,
    };
  }

  return await res.json();
}

/**
 * Start a new generation via FastAPI.
 */
export async function generate(params: GenerateParams): Promise<GenerateResponse> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  try {
    const data = await apiFetch<any>('/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt: params.prompt,
        preset_slug: params.presetKey,
        model_slug: params.modelKey,
        aspect_ratio: params.input?.params?.aspect_ratio || params.input?.params?.aspectRatio,
        duration: params.input?.params?.duration,
        input_image_url: params.input?.startFramePath,
        reference_image_url: params.input?.referenceImagePath,
        params: params.input?.params,
      }),
    });

    return {
      generationId: data.id,
      status: data.status,
      providerTaskId: data.provider_task_id,
    };
  } catch (error: any) {
    // Handle specific HTTP errors
    if (error.status === 401) {
      console.error('[Generate] 401 — clearing token');
      // clearToken already imported statically
      clearToken();
      window.location.reload();
      throw new Error('Session expired. Reloading...');
    }
    if (error.status === 402) {
      const err = new Error(error.body?.detail || 'Insufficient credits');
      (err as any).code = 402;
      (err as any).type = 'insufficient_credits';
      throw err;
    }
    throw error;
  }
}

/**
 * Check generation status via FastAPI.
 */
export async function getStatus(generationId: string): Promise<StatusResponse> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const data = await apiFetch<any>(`/api/generations/${generationId}`);

  return {
    status: data.status,
    progress: data.progress,
    signedPreviewUrl: data.result_url,
  };
}

/**
 * Download a generation result.
 */
export async function download(generationId: string): Promise<DownloadResponse> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const data = await apiFetch<any>(`/api/generations/${generationId}`);

  return {
    url: data.result_url || '',
    expiresAt: null,
  };
}
