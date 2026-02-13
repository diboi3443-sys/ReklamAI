// Dynamic payload builder for KIE.ai models
// Builds request payload based on model type and capabilities
// Documentation: https://docs.kie.ai/

export interface ModelCapabilities {
  supports_image_input?: boolean;
  supports_video_input?: boolean;
  supports_start_frame?: boolean;
  supports_end_frame?: boolean;
  supports_audio_input?: boolean;
  family?: string;
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
 * Supports all API families: Market, Veo3, Runway, Luma, Suno, 4o-image, Flux Kontext
 */
export function buildKiePayload(
  modelKey: string,
  input: PayloadInput,
  modelCapabilities?: ModelCapabilities
): Record<string, any> {
  const payload: Record<string, any> = {
    prompt: input.prompt,
  };

  // Detect model type from key
  const isImageModel = modelKey.includes('image') ||
    modelKey.includes('seedream') ||
    modelKey.includes('flux') ||
    modelKey.includes('imagen') ||
    modelKey.includes('grok-imagine') ||
    modelKey.includes('gpt-image') ||
    modelKey.includes('ideogram') ||
    modelKey.includes('recraft') ||
    modelKey.includes('topaz') ||
    modelKey.includes('z-image') ||
    modelKey.includes('qwen');

  const isVideoModel = modelKey.includes('video') ||
    modelKey.includes('kling') ||
    modelKey.includes('bytedance') ||
    modelKey.includes('seedance') ||
    modelKey.includes('hailuo') ||
    modelKey.includes('sora') ||
    modelKey.includes('wan') ||
    modelKey.includes('veo3') ||
    modelKey.includes('runway') ||
    modelKey.includes('gen3') ||
    modelKey.includes('gen4') ||
    modelKey.includes('luma');

  const isAudioModel = modelKey.includes('elevenlabs') ||
    modelKey.includes('infinitalk') ||
    modelKey.includes('audio') ||
    modelKey.includes('sound-effect') ||
    modelKey.includes('speech') ||
    modelKey.includes('chirp') ||
    modelKey.includes('suno');

  // === SPECIAL API FAMILIES ===

  // Suno Music API (chirp-v3-5, chirp-v4)
  // Docs: https://docs.kie.ai/suno-api/quickstart
  // Endpoint: /api/v1/generate
  // Model format: V3_5, V4, V4_5, V4_5PLUS, V4_5AL (NOT chirp-v4)
  const isSuno = modelKey.includes('chirp') || modelKey.includes('suno');
  if (isSuno) {
    // Map model key to Suno model format
    let sunoModel = 'V4'; // default
    if (modelKey.includes('v3-5') || modelKey.includes('v3_5')) {
      sunoModel = 'V3_5';
    } else if (modelKey.includes('v4')) {
      sunoModel = 'V4';
    } else if (modelKey.includes('v4-5') || modelKey.includes('v4_5')) {
      sunoModel = 'V4_5';
    }

    payload.model = sunoModel;
    payload.prompt = input.prompt;
    payload.instrumental = input.params?.instrumental !== undefined ? input.params.instrumental : false;
    // customMode is required - use true by default (API may require non-null boolean)
    payload.customMode = input.params?.customMode !== undefined ? Boolean(input.params.customMode) : true;
    if (input.params?.duration) {
      payload.duration = input.params.duration;
    }
    console.log(`[PAYLOAD] Building Suno payload for: ${modelKey} (model: ${sunoModel}, customMode: ${payload.customMode})`);
    return payload;
  }

  // Veo3 API
  // Docs: https://docs.kie.ai/veo3-api/quickstart
  const isVeo3 = modelKey.includes('veo3');
  if (isVeo3) {
    payload.prompt = input.prompt;
    if (input.params?.aspect_ratio) {
      payload.aspect_ratio = input.params.aspect_ratio;
    }
    if (input.params?.duration) {
      payload.duration = input.params.duration;
    }
    console.log(`[PAYLOAD] Building Veo3 payload for: ${modelKey}`);
    return payload;
  }

  // Runway API (gen3a_turbo, gen4_turbo)
  // Docs: https://docs.kie.ai/runway-api/quickstart
  const isRunway = modelKey.includes('runway') || modelKey.includes('gen3') || modelKey.includes('gen4');
  if (isRunway && isVideoModel) {
    payload.prompt = input.prompt;
    if (input.referenceImageUrl) {
      payload.image = input.referenceImageUrl;
    }
    if (input.params?.duration) {
      payload.duration = input.params.duration;
    }
    if (input.params?.ratio) {
      payload.ratio = input.params.ratio;
    }
    console.log(`[PAYLOAD] Building Runway payload for: ${modelKey}`);
    return payload;
  }

  // Luma API (dream-machine, ray-2)
  // Docs: https://docs.kie.ai/luma-api/quickstart
  // Endpoint: /api/v1/modify/generate
  const isLuma = modelKey.includes('luma') || modelKey.includes('dream-machine') || modelKey.includes('ray-2');
  if (isLuma) {
    // Luma requires prompt field (not empty)
    payload.prompt = input.prompt || '';
    if (input.referenceImageUrl) {
      payload.imageUrl = input.referenceImageUrl; // Try imageUrl instead of image
    }
    if (input.params?.aspect_ratio) {
      payload.aspect_ratio = input.params.aspect_ratio;
    }
    console.log(`[PAYLOAD] Building Luma payload for: ${modelKey}`);
    return payload;
  }

  // Flux Kontext API
  // Docs: https://docs.kie.ai/flux-kontext-api/quickstart
  const isFluxKontext = modelKey.includes('flux-kontext');
  if (isFluxKontext) {
    payload.prompt = input.prompt;
    payload.aspect_ratio = input.params?.aspect_ratio || '1:1';
    if (input.referenceImageUrl) {
      payload.input_image = input.referenceImageUrl;
    }
    console.log(`[PAYLOAD] Building Flux Kontext payload for: ${modelKey}`);
    return payload;
  }

  // 4o Image API (gpt-image)
  // Docs: https://docs.kie.ai/4o-image-api/quickstart
  // Endpoint: /api/v1/gpt4o-image/generate
  const is4oImage = modelKey.includes('gpt-image');
  if (is4oImage) {
    // 4o Image requires: prompt OR fileUrl (at least one not empty)
    payload.prompt = input.prompt || '';
    if (input.referenceImageUrl) {
      payload.fileUrl = input.referenceImageUrl; // Use fileUrl instead of image
    }
    payload.aspect_ratio = input.params?.aspect_ratio || '1:1';
    console.log(`[PAYLOAD] Building 4o-image payload for: ${modelKey}`);
    return payload;
  }

  // === MARKET API MODELS ===
  // All use unified createTask endpoint with 'model' and 'input' fields

  // Add random seed for non-deterministic generation
  if (!input.params?.seed && !input.params?.random_seed) {
    const randomSeed = Math.floor(Math.random() * 2147483647);
    payload.seed = randomSeed;
    console.log(`[PAYLOAD] Generated random seed: ${randomSeed} for model: ${modelKey}`);
  } else if (input.params?.seed) {
    payload.seed = input.params.seed;
  }

  // Models requiring aspect_ratio
  const requiresAspectRatio = modelKey.includes('grok-imagine') ||
    modelKey.includes('ideogram') ||
    modelKey.includes('flux-2') ||
    modelKey.includes('flux2') ||
    modelKey.includes('seedream') ||
    modelKey.includes('z-image');
  if (requiresAspectRatio) {
    payload.aspect_ratio = input.params?.aspect_ratio || '1:1';
  }

  // Flux-2 models require resolution
  const isFlux2 = modelKey.includes('flux-2') || modelKey.includes('flux2');
  if (isFlux2) {
    payload.resolution = input.params?.resolution || '1K';
  }

  // Image models
  if (isImageModel && input.referenceImageUrl) {
    if (modelKey.includes('image-to-image') ||
      modelKey.includes('edit') ||
      modelKey.includes('upscale') ||
      modelKey.includes('remove-background') ||
      modelKey.includes('crisp-upscale') ||
      modelKey.includes('reframe')) {
      payload.image = input.referenceImageUrl;
    } else {
      payload.reference_image = input.referenceImageUrl;
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
    // Video duration - MUST be a string for KIE API
    if (input.params?.duration) {
      payload.duration = String(input.params.duration);
    }
  }

  // Audio models (ElevenLabs, etc.)
  if (isAudioModel) {
    if (modelKey.includes('elevenlabs') || modelKey.includes('sound-effect')) {
      payload.text = input.prompt;
      payload.duration_seconds = input.params?.duration_seconds || 5;
    }
    if (modelKey.includes('speech-to-text')) {
      // Speech-to-text needs audio input
      if (input.audioUrl) {
        payload.audio = input.audioUrl;
      }
    }
    if (input.audioUrl && !payload.audio) {
      payload.audio = input.audioUrl;
    }
  }

  // Infinitalk avatar
  if (modelKey.includes('infinitalk')) {
    if (input.audioUrl) {
      payload.audio = input.audioUrl;
    }
    if (input.referenceImageUrl) {
      payload.image = input.referenceImageUrl;
    }
  }

  // Topaz upscale
  if (modelKey.includes('topaz')) {
    if (modelKey.includes('video')) {
      if (input.referenceVideoUrl) {
        payload.video = input.referenceVideoUrl;
      }
    } else {
      if (input.referenceImageUrl) {
        payload.image = input.referenceImageUrl;
      }
    }
    payload.scale = input.params?.scale || 2;
  }

  // Merge additional params
  if (input.params) {
    for (const [key, value] of Object.entries(input.params)) {
      if (key === 'aspect_ratio' && payload.aspect_ratio && !value) {
        continue;
      }
      if (!payload[key]) {
        payload[key] = value;
      }
    }
  }

  console.log(`[PAYLOAD] Building Market API payload for: ${modelKey}`);
  return payload;
}
