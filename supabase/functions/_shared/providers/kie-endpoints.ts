// KIE.ai API endpoint configuration
// Supports multiple API families: Market, Veo3, 4o Image, Runway, Luma, Flux Kontext, Suno

export type KieApiFamily =
  | 'market'           // Unified Market API (most models)
  | 'veo3'            // Google Veo 3 API
  | '4o-image'        // OpenAI 4o Image API
  | 'runway'          // Runway API
  | 'luma'           // Luma API
  | 'flux-kontext'   // Flux Kontext API
  | 'suno';          // Suno Music API

export interface KieEndpointConfig {
  family: KieApiFamily;
  createPath: string;      // POST endpoint for creating tasks
  statusPath: string;      // GET endpoint for task status/details
  downloadPath?: string;   // GET endpoint for download URL (optional, may come from status)
  callbackPath?: string;   // Webhook callback endpoint (if supported)
}

/**
 * Market API endpoints (unified, used by most models)
 * Docs: https://docs.kie.ai/market/quickstart
 */
export const MARKET_ENDPOINTS: KieEndpointConfig = {
  family: 'market',
  createPath: '/api/v1/jobs/createTask',
  statusPath: '/api/v1/jobs/recordInfo',
};

/**
 * Veo 3 API endpoints
 * Docs: https://docs.kie.ai/veo3-api/quickstart
 */
export const VEO3_ENDPOINTS: KieEndpointConfig = {
  family: 'veo3',
  createPath: '/api/v1/veo/generate',
  statusPath: '/api/v1/veo/getDetails',
  downloadPath: '/api/v1/veo/get1080pVideo',
  callbackPath: '/api/v1/veo/callbacks',
};

/**
 * 4o Image API endpoints
 * Docs: https://docs.kie.ai/4o-image-api/quickstart
 */
export const FOUR_O_IMAGE_ENDPOINTS: KieEndpointConfig = {
  family: '4o-image',
  createPath: '/api/v1/4o-image/generate',
  statusPath: '/api/v1/4o-image/getDetails',
  downloadPath: '/api/v1/4o-image/getDownloadUrl',
  callbackPath: '/api/v1/4o-image/callbacks',
};

/**
 * Runway API endpoints
 * Docs: https://docs.kie.ai/runway-api/quickstart
 */
export const RUNWAY_ENDPOINTS: KieEndpointConfig = {
  family: 'runway',
  createPath: '/api/v1/runway/generate',
  statusPath: '/api/v1/runway/getDetails',
  callbackPath: '/api/v1/runway/callbacks',
};

/**
 * Luma API endpoints
 * Docs: https://docs.kie.ai/luma-api/quickstart
 */
export const LUMA_ENDPOINTS: KieEndpointConfig = {
  family: 'luma',
  createPath: '/api/v1/luma/generate',
  statusPath: '/api/v1/luma/getDetails',
  callbackPath: '/api/v1/luma/callbacks',
};

/**
 * Flux Kontext API endpoints
 * Docs: https://docs.kie.ai/flux-kontext-api/quickstart
 * Models: flux-kontext-pro, flux-kontext-max
 */
export const FLUX_KONTEXT_ENDPOINTS: KieEndpointConfig = {
  family: 'flux-kontext',
  createPath: '/api/v1/flux/kontext/generate',
  statusPath: '/api/v1/flux/kontext/getImageDetails',
  callbackPath: '/api/v1/flux/kontext/callbacks',
};

/**
 * Suno Music API endpoints
 * Docs: https://docs.kie.ai/suno-api/quickstart
 * Models: chirp-v3-5, chirp-v4
 */
export const SUNO_ENDPOINTS: KieEndpointConfig = {
  family: 'suno',
  createPath: '/api/v1/suno/generate',
  statusPath: '/api/v1/suno/getDetails',
  callbackPath: '/api/v1/suno/callbacks',
};

/**
 * Get endpoint config for a model by API family
 * Defaults to Market API if family is unknown
 */
export function getKieEndpoints(family?: KieApiFamily): KieEndpointConfig {
  switch (family) {
    case 'veo3':
      return VEO3_ENDPOINTS;
    case '4o-image':
      return FOUR_O_IMAGE_ENDPOINTS;
    case 'runway':
      return RUNWAY_ENDPOINTS;
    case 'luma':
      return LUMA_ENDPOINTS;
    case 'flux-kontext':
      return FLUX_KONTEXT_ENDPOINTS;
    case 'suno':
      return SUNO_ENDPOINTS;
    case 'market':
    default:
      return MARKET_ENDPOINTS;
  }
}

/**
 * Get endpoint config for a model by model identifier
 * This function should be updated when we have the model registry
 * For now, defaults to Market API
 */
export function getKieEndpointsByModel(modelIdentifier: string): KieEndpointConfig {
  // TODO: Map model identifiers to API families based on model registry
  // For now, all models use Market API
  return MARKET_ENDPOINTS;
}
