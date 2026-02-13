// Provider adapter types

export type ProviderStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

export interface ProviderGenerateResult {
  taskId: string;
  status: ProviderStatus;
  message?: string;
}

export interface ProviderStatusResult {
  status: ProviderStatus;
  progress?: number;
  outputUrl?: string;
  error?: string;
  raw: Record<string, any>;
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
    audioUrl?: string;
    params?: Record<string, any>;
  };
  endpointPath?: string;
  apiFamily?: 'market' | 'veo3' | '4o-image' | 'runway' | 'luma' | 'flux-kontext' | 'suno';
  callBackUrl?: string;
}

// Map provider status to internal status
export function mapProviderStatus(providerStatus: string): ProviderStatus {
  const statusLower = providerStatus.toLowerCase();
  if (statusLower.includes('queue') || statusLower.includes('pending')) {
    return 'queued';
  }
  if (statusLower.includes('process') || statusLower.includes('generating') || statusLower.includes('running')) {
    return 'processing';
  }
  if (statusLower.includes('succeed') || statusLower.includes('complete') || statusLower.includes('done')) {
    return 'succeeded';
  }
  if (statusLower.includes('fail') || statusLower.includes('error')) {
    return 'failed';
  }
  return 'processing'; // Default fallback
}
