// KIE.ai provider adapter (legacy - use kie-client.ts for new code)
// This file is kept for backward compatibility
import type {
  ProviderGenerateResult,
  ProviderStatusResult,
  ProviderGeneratePayload,
} from './types.ts';
import { mapProviderStatus } from './types.ts';
import { KieClient } from './kie-client.ts';
import { buildKiePayload } from './payload-builder.ts';

/**
 * Map internal model keys (from DB) to KIE.ai API model names
 * Since we now store KIE.ai model identifiers directly in DB (e.g., 'seedream-v4-text-to-image'),
 * this function is mainly for backward compatibility with old model keys.
 * New models should use KIE.ai identifiers directly in the DB.
 */
export function mapModelKeyToKieModel(modelKey: string, modality: string): string {
  // Legacy mapping for old model keys (if any still exist)
  const legacyModelMap: Record<string, string> = {
    'kie-flux-pro': 'flux2/pro-text-to-image',
    'kie-flux-dev': 'flux2/flex-text-to-image',
    'kie-video-1': 'kling/text-to-video',
    'kie-edit-1': 'flux2/pro-image-to-image',
  };

  // If legacy mapping exists, use it
  if (legacyModelMap[modelKey]) {
    console.log(`[KIE] Legacy mapping: ${modelKey} → ${legacyModelMap[modelKey]}`);
    return legacyModelMap[modelKey];
  }

  // Otherwise, use modelKey as-is (should be KIE.ai model identifier)
  // This allows direct use of KIE.ai model names in DB
  return modelKey;
}

export async function kieGenerate(
  payload: ProviderGeneratePayload
): Promise<ProviderGenerateResult> {
  // Use new centralized client
  const client = new KieClient();

  // Use modelKey directly (should be KIE.ai model identifier from DB)
  // No mapping needed - DB stores exact identifiers
  const kieModelName = payload.modelKey;
  console.log(`[KIE] Using model identifier: "${kieModelName}"`);

  // Get endpoint path if provided (for different API families)
  const endpointPath = (payload as any).endpointPath;
  if (endpointPath) {
    console.log(`[KIE] Using custom endpoint: ${endpointPath}`);
  }

  // Build payload dynamically
  const requestPayload = buildKiePayload(
    kieModelName,
    {
      prompt: payload.prompt,
      referenceImageUrl: payload.input?.referenceImageUrl,
      referenceVideoUrl: payload.input?.referenceVideoUrl,
      startFrameUrl: payload.input?.startFrameUrl,
      endFrameUrl: payload.input?.endFrameUrl,
      audioUrl: payload.input?.audioUrl,
      params: payload.input?.params,
    }
  );

  try {
    const result = await client.createTask(kieModelName, requestPayload, endpointPath);
    return {
      taskId: result.taskId,
      status: result.status as ProviderGenerateResult['status'],
      message: undefined,
    };
  } catch (error: any) {
    console.error('KIE generate error:', error);
    // Preserve structured error from kie-client
    if (error.code === 422) {
      const structuredError = new Error(error.message || 'Model not supported');
      (structuredError as any).code = 422;
      (structuredError as any).modelSent = error.modelSent || kieModelName;
      throw structuredError;
    }
    throw error;
  }
}

export async function kieStatus(
  taskId: string,
  modelKey?: string,
  statusEndpointPath?: string
): Promise<ProviderStatusResult> {
  // Use new centralized client
  const client = new KieClient();

  try {
    const result = await client.getTaskStatus(taskId, modelKey, statusEndpointPath);
    return {
      status: result.status,
      progress: result.progress,
      outputUrl: result.outputUrl,
      error: result.error,
      raw: result.raw,
    };
  } catch (error) {
    console.error('KIE status error:', error);
    throw error;
  }
}
