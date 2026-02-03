// Dynamic payload builder for KIE.ai models
// Builds request payload based on model type and capabilities

export interface ModelCapabilities {
  supports_image_input?: boolean;
  supports_video_input?: boolean;
  supports_start_frame?: boolean;
  supports_end_frame?: boolean;
  supports_audio_input?: boolean;
  [key: string]: any;
}

export interface PayloadInput {
  prompt: string;
  referenceImageUrl?: string;
  referenceVideoUrl?: string;
  startFrameUrl?: string;
  endFrameUrl?: string;
  audioUrl?: string;
  params?: Record<string, any>;
}

/**
 * Build KIE.ai request payload based on model and input
 */
export function buildKiePayload(
  modelKey: string,
  input: PayloadInput,
  modelCapabilities?: ModelCapabilities
): Record<string, any> {
  const payload: Record<string, any> = {
    prompt: input.prompt,
  };

  // Add random seed for non-deterministic generation (if not provided in params)
  // This ensures each generation produces different results
  if (!input.params?.seed && !input.params?.random_seed) {
    // Generate random seed between 0 and 2^31-1 (max safe integer for most APIs)
    const randomSeed = Math.floor(Math.random() * 2147483647);
    payload.seed = randomSeed;
    console.log(`[PAYLOAD] Generated random seed: ${randomSeed} for model: ${modelKey}`);
  } else if (input.params?.seed) {
    payload.seed = input.params.seed;
  } else if (input.params?.random_seed) {
    payload.random_seed = input.params.random_seed;
  }

  // Some models require aspect_ratio (e.g., grok-imagine/text-to-image, gpt-image, ideogram, flux2)
  // Default to 16:9 if not provided
  const requiresAspectRatio = modelKey.includes('grok-imagine') ||
                               modelKey.includes('gpt-image') ||
                               modelKey.includes('ideogram') ||
                               modelKey.includes('flux2');

  // Set aspect_ratio before processing other fields
  if (requiresAspectRatio) {
    payload.aspect_ratio = input.params?.aspect_ratio || '16:9';
  }

  // Determine model type from key
  const isImageModel = modelKey.includes('image') ||
                       modelKey.includes('seedream') ||
                       modelKey.includes('flux') ||
                       modelKey.includes('imagen') ||
                       modelKey.includes('grok-imagine') ||
                       modelKey.includes('gpt-image') ||
                       modelKey.includes('ideogram') ||
                       modelKey.includes('recraft') ||
                       modelKey.includes('topaz');

  const isVideoModel = modelKey.includes('video') ||
                       modelKey.includes('kling') ||
                       modelKey.includes('bytedance') ||
                       modelKey.includes('hailuo') ||
                       modelKey.includes('sora') ||
                       modelKey.includes('wan') ||
                       modelKey.includes('grok-imagine');

  const isAudioModel = modelKey.includes('elevenlabs') ||
                       modelKey.includes('infinitalk') ||
                       modelKey.includes('audio');

  const isEditModel = modelKey.includes('edit') ||
                      modelKey.includes('upscale') ||
                      modelKey.includes('remove-background') ||
                      modelKey.includes('crisp-upscale') ||
                      modelKey.includes('character-edit') ||
                      modelKey.includes('character-remix') ||
                      modelKey.includes('reframe');

  // Image models
  if (isImageModel) {
    if (input.referenceImageUrl) {
      // Image-to-image models
      if (modelKey.includes('image-to-image') ||
          modelKey.includes('edit') ||
          modelKey.includes('upscale') ||
          modelKey.includes('remove-background') ||
          modelKey.includes('crisp-upscale')) {
        payload.image = input.referenceImageUrl;
      } else {
        // Some models use different field names
        payload.reference_image = input.referenceImageUrl;
      }
    }
  }

  // Video models
  if (isVideoModel) {
    if (input.referenceImageUrl) {
      payload.image = input.referenceImageUrl;
    }
    if (input.referenceVideoUrl) {
      payload.video = input.referenceVideoUrl;
    }
    if (input.startFrameUrl) {
      payload.start_frame = input.startFrameUrl;
    }
    if (input.endFrameUrl) {
      payload.end_frame = input.endFrameUrl;
    }
  }

  // Audio models
  if (isAudioModel) {
    if (input.audioUrl) {
      payload.audio = input.audioUrl;
    }
  }

  // Merge additional params from input (but don't override aspect_ratio if we set it)
  if (input.params) {
    for (const [key, value] of Object.entries(input.params)) {
      if (key === 'aspect_ratio' && payload.aspect_ratio && !value) {
        // Keep our default aspect_ratio if input doesn't provide one
        continue;
      }
      payload[key] = value;
    }
  }

  return payload;
}
