// Centralized KIE.ai API client
// Handles all KIE.ai API interactions with proper model support
// Uses unified KIE Market API endpoints for all models

export interface KieTaskResponse {
  id?: string;
  task_id?: string;
  taskId?: string;
  job_id?: string;
  status?: string;
  message?: string;
  output_url?: string;
  outputUrl?: string;
  result_url?: string;
  resultUrl?: string;
  progress?: number;
  percent_complete?: number;
  error?: string;
  error_message?: string;
  [key: string]: any;
}

export interface KieClientConfig {
  baseUrl?: string;
  apiKey?: string;
}

/**
 * Sanitize and validate KIE base URL
 * Removes trailing slashes and any path suffixes like /api-key, /docs, /market
 * Keeps only scheme+host (e.g., https://api.kie.ai)
 */
function sanitizeKieBaseUrl(url: string | undefined): string {
  const defaultUrl = 'https://api.kie.ai';

  if (!url) {
    return defaultUrl;
  }

  let sanitized = url.trim();

  try {
    // Parse as URL to extract scheme+host only
    const parsed = new URL(sanitized);

    // Reject if it's the website (kie.ai without api subdomain)
    if (parsed.hostname === 'kie.ai' || parsed.hostname.includes('kie.ai') && !parsed.hostname.includes('api.kie.ai')) {
      console.error(`[KIE] Invalid KIE_BASE_URL appears to be website URL: ${sanitized}`);
      console.error(`[KIE] Falling back to default: ${defaultUrl}`);
      return defaultUrl;
    }

    // Reject if path contains /api-key, /docs, /market (wrong paths)
    if (parsed.pathname.includes('/api-key') || parsed.pathname.includes('/docs') || parsed.pathname.includes('/market')) {
      console.error(`[KIE] Invalid KIE_BASE_URL contains path suffix: ${sanitized}`);
      console.error(`[KIE] Falling back to default: ${defaultUrl}`);
      return defaultUrl;
    }

    // Return only scheme+host (remove path, query, hash)
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch (e) {
    // If URL parsing fails, try simple string checks
    console.warn(`[KIE] Failed to parse KIE_BASE_URL as URL: ${sanitized}, using simple sanitization`);

    // Remove trailing slashes
    sanitized = sanitized.replace(/\/+$/, '');

    // Reject if contains /api-key, /docs, /market
    if (sanitized.includes('/api-key') || sanitized.includes('/docs') || sanitized.includes('/market')) {
      console.error(`[KIE] Invalid KIE_BASE_URL contains path suffix: ${sanitized}`);
      console.error(`[KIE] Falling back to default: ${defaultUrl}`);
      return defaultUrl;
    }

    // Extract scheme+host if possible
    const match = sanitized.match(/^(https?:\/\/[^\/]+)/);
    if (match) {
      return match[1];
    }

    return defaultUrl;
  }
}

export class KieClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config?: KieClientConfig) {
    // @ts-ignore - Deno is available in Edge Functions runtime
    const envBaseUrl = Deno.env.get('KIE_BASE_URL');
    this.baseUrl = sanitizeKieBaseUrl(config?.baseUrl || envBaseUrl);
    // @ts-ignore - Deno is available in Edge Functions runtime
    this.apiKey = config?.apiKey || Deno.env.get('KIE_API_KEY') || '';

    if (!this.apiKey) {
      throw new Error('Missing secret: KIE_API_KEY');
    }

    console.log(`[KIE] Client initialized with baseUrl: ${this.baseUrl}`);
  }

  /**
   * Create a task in KIE.ai
   * @param model - KIE.ai model identifier (e.g., 'seedream-v4-text-to-image')
   * @param payload - Task payload (varies by model type)
   * @param endpointPath - Optional custom endpoint path (for different API families)
   */
  async createTask(
    model: string,
    payload: Record<string, any>,
    endpointPath?: string
  ): Promise<{ taskId: string; status: string }> {
    // Use provided endpoint path or default to Market API
    const createPath = endpointPath || '/api/v1/jobs/createTask';
    const url = `${this.baseUrl}${createPath}`;

    // Build request body for KIE Market API
    // Structure: { model: "...", input: { prompt, ...other fields } }
    // KIE Market API requires 'model' at top level and 'input' field (cannot be null)
    // Check if payload already contains model field (avoid duplication)
    const hasModelField = payload.model || payload.modelName || payload.model_name || payload.model_id;
    const modelValue = hasModelField
      ? (payload.model || payload.modelName || payload.model_name || payload.model_id)
      : model;

    // Validate model is not empty
    if (!modelValue || (typeof modelValue === 'string' && modelValue.trim() === '')) {
      throw new Error('KIE API error: Model name is required and cannot be empty');
    }

    // KIE Market API structure: model at top level, input contains prompt and other fields
    const requestBody: Record<string, any> = {
      model: modelValue,
      input: {
        prompt: payload.prompt || '',
        ...(payload.image && { image: payload.image }),
        ...(payload.reference_image && { reference_image: payload.reference_image }),
        ...(payload.video && { video: payload.video }),
        ...(payload.start_frame && { start_frame: payload.start_frame }),
        ...(payload.end_frame && { end_frame: payload.end_frame }),
        ...(payload.audio && { audio: payload.audio }),
        // Include any other fields from payload (except prompt, model fields)
        ...Object.fromEntries(
          Object.entries(payload).filter(([key]) =>
            !['prompt', 'model', 'modelName', 'model_name', 'model_id', 'image', 'reference_image', 'video', 'start_frame', 'end_frame', 'audio'].includes(key)
          )
        ),
      },
    };

    // Safe logging (never log API key)
    console.log(`[KIE] ===== CREATE TASK REQUEST =====`);
    console.log(`[KIE] Model parameter: ${model}`);
    console.log(`[KIE] Model value in request: ${modelValue}`);
    console.log(`[KIE] Model type: ${typeof modelValue}`);
    console.log(`[KIE] Request URL: ${url}`);
    console.log(`[KIE] Request body keys: ${Object.keys(requestBody).join(', ')}`);
    console.log(`[KIE] Input keys: ${Object.keys(requestBody.input || {}).join(', ')}`);
    console.log(`[KIE] Top-level model field: ${requestBody.model || 'MISSING'}`);
    // Log sanitized body (payload-builder doesn't include secrets, so safe to log)
    const sanitizedBody = JSON.parse(JSON.stringify(requestBody));
    console.log(`[KIE] Full request body:`, JSON.stringify(sanitizedBody, null, 2));
    console.log(`[KIE] ===============================`);

    // Use Promise.race for more reliable timeout (20 seconds max for task creation)
    const fetchPromise = (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log(`[KIE] Response status: ${response.status}`);

        // Parse response - try JSON first
        let data: any;
        try {
          data = await response.json();
        } catch (parseError) {
          const text = await response.text();
          console.error(`[KIE] Failed to parse JSON response. Status: ${response.status}`);
          const errorSnippet = text.length > 400 ? text.substring(0, 400) : text;
          console.error(`[KIE] Response text (first 400 chars): ${errorSnippet}`);
          throw new Error(`KIE API returned invalid JSON: ${response.status}`);
        }

        // Safe logging - log full response for debugging
        console.log(`[KIE] Response status: ${response.status}`);
        console.log(`[KIE] Response keys: ${Object.keys(data).join(', ')}`);
        console.log(`[KIE] Full response:`, JSON.stringify(data, null, 2));

        // Log error body snippet if not ok (safe - no API key)
        if (!response.ok) {
          const errorBody = JSON.stringify(data);
          const errorSnippet = errorBody.length > 400 ? errorBody.substring(0, 400) : errorBody;
          console.error(`[KIE] Error body (first 400 chars): ${errorSnippet}`);
        }

        // Check for application-level errors (HTTP 200 but error in body)
        // KIE Market API returns { code: 422, msg: "...", data: null } for validation errors
        if (data.code && data.code !== 200 && data.code !== 0) {
          const errorMsg = data.msg || data.message || 'Unknown error';
          console.error(`[KIE] Application error: code=${data.code}, msg=${errorMsg}`);

          // Special handling for "model not supported" error - might indicate API key access issue
          if (data.code === 422 && (errorMsg.toLowerCase().includes('model') || errorMsg.toLowerCase().includes('not supported'))) {
            console.error(`[KIE] Model "${modelValue}" is not supported. Possible reasons:`);
            console.error(`[KIE] 1. API key does not have access to Market API`);
            console.error(`[KIE] 2. Model is not available in your plan/region`);
            console.error(`[KIE] 3. Model name format is incorrect`);
            console.error(`[KIE] Please check: https://kie.ai/market for available models`);
            console.error(`[KIE] And verify your API key has Market API access at: https://kie.ai/api-key`);

            // Throw structured error for better handling
            const error = new Error(`KIE API error: ${data.code} - ${errorMsg}`);
            (error as any).code = data.code;
            (error as any).modelSent = modelValue;
            throw error;
          }

          throw new Error(`KIE API error: ${data.code} - ${errorMsg}`);
        }

        // Check HTTP status
        if (!response.ok) {
          const errorSnippet = JSON.stringify(data).length > 500
            ? JSON.stringify(data).substring(0, 500) + '...'
            : JSON.stringify(data);

          // Detect HTML responses (404 from website)
          const isHtml = typeof data === 'string' && (
            data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html')
          );

          console.error(`[KIE] HTTP error: ${response.status}`);
          console.error(`[KIE] Error body (${isHtml ? 'HTML' : 'JSON'}): ${errorSnippet}`);

          if (isHtml) {
            throw new Error(`KIE API returned HTML (likely wrong endpoint): ${response.status}. Check KIE_BASE_URL and endpoint configuration.`);
          }

          throw new Error(`KIE API error: ${response.status} - ${errorSnippet}`);
        }

        // Extract taskId from various possible fields (KIE Market API may use different field names)
        // Common patterns: id, taskId, task_id, jobId, job_id, data.id, data.taskId, data.recordId, etc.
        const taskId = data.id ||
                      data.task_id ||
                      data.taskId ||
                      data.job_id ||
                      data.jobId ||
                      data.recordId ||
                      data.task?.id ||
                      data.job?.id ||
                      data.result?.id ||
                      data.result?.taskId ||
                      (data.data && (
                        data.data.id ||
                        data.data.task_id ||
                        data.data.taskId ||
                        data.data.jobId ||
                        data.data.recordId
                      ));

        if (!taskId) {
          console.error(`[KIE] No task ID found in response`);
          console.error(`[KIE] Response structure:`, JSON.stringify(data, null, 2));
          console.error(`[KIE] Available keys: ${Object.keys(data).join(', ')}`);
          if (data.data && typeof data.data === 'object') {
            console.error(`[KIE] data keys: ${Object.keys(data.data).join(', ')}`);
          }
          throw new Error('No task ID returned from KIE API. Check logs for response structure.');
        }

        const status = data.status || data.task?.status || data.result?.status || 'queued';
        console.log(`[KIE] Task ID extracted: ${taskId}, Status: ${status}`);

        return {
          taskId: String(taskId),
          status: this.mapStatus(status),
        };
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          throw new Error('KIE API request timeout: Task creation took too long (20s)');
        }
        throw error;
      }
    })();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.error(`[KIE] Request timeout after 20 seconds (Promise.race)`);
        reject(new Error('KIE API request timeout: Task creation took too long (20s)'));
      }, 20000);
    });

    try {
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error: any) {
      console.error(`[KIE] createTask error:`, error);
      throw error;
    }
  }

  /**
   * Get task status from KIE.ai
   * @param taskId - Task ID from createTask response
   * @param modelKey - Optional model key (for logging only)
   * @param statusEndpointPath - Optional custom status endpoint path (for different API families)
   */
  async getTaskStatus(
    taskId: string,
    modelKey?: string,
    statusEndpointPath?: string
  ): Promise<{
    status: 'queued' | 'processing' | 'succeeded' | 'failed';
    progress?: number;
    outputUrl?: string;
    error?: string;
    raw: KieTaskResponse;
  }> {
    // Use provided endpoint path or default to Market API
    const statusPath = statusEndpointPath || '/api/v1/jobs/recordInfo';
    const url = `${this.baseUrl}${statusPath}?taskId=${encodeURIComponent(taskId)}`;

    // Safe logging
      console.log(`[KIE] ===== GET TASK STATUS =====`);
      console.log(`[KIE] Task ID: ${taskId}`);
      if (modelKey) {
        console.log(`[KIE] Model: ${modelKey}`);
      }
      console.log(`[KIE] Request URL: ${url}`);

    // Create AbortController for timeout (10 seconds max for status check)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`[KIE] Response status: ${response.status}`);

      if (!response.ok) {
        let errorData: any;
        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        try {
          if (isJson) {
            errorData = await response.json();
          } else {
            const errorText = await response.text();
            const isHtml = errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html');

            if (isHtml) {
              console.error(`[KIE] API error: ${response.status} (HTML response - likely wrong endpoint)`);
              throw new Error(`KIE API returned HTML (likely wrong endpoint): ${response.status}`);
            }

            errorData = { message: errorText.substring(0, 200) };
          }
        } catch (parseError) {
          errorData = { message: `HTTP ${response.status}` };
        }

        const errorMsg = errorData.msg || errorData.message || errorData.error || `HTTP ${response.status}`;
        console.error(`[KIE] API error: ${response.status} - ${errorMsg}`);
        throw new Error(`KIE API error: ${response.status} - ${errorMsg}`);
      }

      const data: any = await response.json();

      // KIE Market API returns { code: 200, data: { state: "...", resultJson: "..." } }
      const taskData = data.data || data;

      // Safe logging
      console.log(`[KIE] Task status retrieved`);
      console.log(`[KIE] Response keys: ${Object.keys(data).join(', ')}`);
      if (taskData) {
        console.log(`[KIE] Task data keys: ${Object.keys(taskData).join(', ')}`);
      }

      // KIE uses 'state' field, not 'status'
      const state = taskData.state || taskData.status || 'processing';
      console.log(`[KIE] Raw state from KIE: "${state}"`);
      console.log(`[KIE] Full taskData:`, JSON.stringify(taskData, null, 2));

      const status = this.mapStatus(state);

      // Extract output URL from resultJson (KIE Market API format)
      let outputUrl: string | undefined;
      if (taskData.resultJson) {
        try {
          const result = JSON.parse(taskData.resultJson);
          // KIE returns resultUrls array for some models (e.g., grok-imagine)
          if (result.resultUrls && Array.isArray(result.resultUrls) && result.resultUrls.length > 0) {
            outputUrl = result.resultUrls[0]; // Use first URL
          } else if (result.url || result.output_url || result.download_url) {
            outputUrl = result.url || result.output_url || result.download_url;
          }
        } catch (e) {
          // resultJson is not valid JSON, try direct fields
        }
      }

      // Fallback to direct fields
      if (!outputUrl) {
        outputUrl = taskData.output_url || taskData.outputUrl || taskData.result_url ||
                   taskData.resultUrl || taskData.download_url || taskData.downloadUrl ||
                   data.output_url || data.outputUrl || data.result_url || data.resultUrl;
      }

      // Extract error from taskData if available
      const error = taskData.failMsg || taskData.failCode || data.error || data.error_message;

      return {
        status,
        progress: taskData.progress || data.progress || taskData.percent_complete || data.percent_complete,
        outputUrl: outputUrl ? String(outputUrl) : undefined,
        error: error ? String(error) : undefined,
        raw: data,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`[KIE] Request timeout after 10 seconds`);
        throw new Error('KIE API request timeout: Status check took too long (10s)');
      }
      throw error;
    }
  }

  /**
   * Get download URL for task result
   * @param taskId - Task ID from createTask response
   * @param modelKey - Optional model key (for logging only, all models use same endpoint)
   */
  async getDownloadUrl(taskId: string, modelKey?: string): Promise<string> {
    // Unified KIE Market API endpoint - same for all models
    // Download URL comes from recordInfo response, so we use the same endpoint
    const url = `${this.baseUrl}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`;

    console.log(`[KIE] Getting download URL for task: ${taskId}`);
    if (modelKey) {
      console.log(`[KIE] Model: ${modelKey}`);
    }
    console.log(`[KIE] Request URL: ${url}`);

    // Create AbortController for timeout (10 seconds max for download URL)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`[KIE] Response status: ${response.status}`);

      if (!response.ok) {
        let errorData: any;
        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        try {
          if (isJson) {
            errorData = await response.json();
          } else {
            const errorText = await response.text();
            const isHtml = errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html');

            if (isHtml) {
              console.error(`[KIE] API error: ${response.status} (HTML response - likely wrong endpoint)`);
              throw new Error(`KIE API returned HTML (likely wrong endpoint): ${response.status}`);
            }

            errorData = { message: errorText.substring(0, 200) };
          }
        } catch (parseError) {
          errorData = { message: `HTTP ${response.status}` };
        }

        const errorMsg = errorData.msg || errorData.message || errorData.error || `HTTP ${response.status}`;
        console.error(`[KIE] API error: ${response.status} - ${errorMsg}`);
        throw new Error(`KIE API error: ${response.status} - ${errorMsg}`);
      }

      const data: any = await response.json();
      console.log(`[KIE] Download URL response keys: ${Object.keys(data).join(', ')}`);

      // KIE Market API returns { code: 200, data: { resultJson: "..." } }
      const taskData = data.data || data;

      // Extract download URL from resultJson (KIE Market API format)
      let downloadUrl: string | undefined;
      if (taskData.resultJson) {
        try {
          const result = JSON.parse(taskData.resultJson);
          // KIE returns resultUrls array for some models (e.g., grok-imagine)
          if (result.resultUrls && Array.isArray(result.resultUrls) && result.resultUrls.length > 0) {
            downloadUrl = result.resultUrls[0]; // Use first URL
          } else if (result.url || result.output_url || result.download_url) {
            downloadUrl = result.url || result.output_url || result.download_url;
          }
        } catch (e) {
          console.error(`[KIE] Failed to parse resultJson: ${e}`);
        }
      }

      // Fallback to direct fields
      if (!downloadUrl) {
        downloadUrl = taskData.url ||
                     taskData.download_url ||
                     taskData.downloadUrl ||
                     taskData.output_url ||
                     taskData.outputUrl ||
                     taskData.result_url ||
                     taskData.resultUrl ||
                     data.url ||
                     data.download_url ||
                     data.output_url ||
                     data.result_url;
      }

      if (!downloadUrl) {
        console.error(`[KIE] No download URL in response`);
        console.error(`[KIE] Response structure:`, JSON.stringify(data, null, 2));
        throw new Error('No download URL returned from KIE API');
      }

      return String(downloadUrl);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`[KIE] Request timeout after 10 seconds`);
        throw new Error('KIE API request timeout: Download URL request took too long (10s)');
      }
      throw error;
    }
  }

  /**
   * Check API key access and credits balance
   * Useful for debugging access issues
   */
  async checkAccess(): Promise<{ credits?: number; error?: string }> {
    const url = `${this.baseUrl}/api/v1/user/credits`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { error: `HTTP ${response.status}: ${errorText.substring(0, 200)}` };
      }

      const data = await response.json();
      return { credits: data.data?.credits || data.credits };
    } catch (error: any) {
      return { error: error.message || 'Unknown error' };
    }
  }

  /**
   * Map KIE.ai status to internal status
   */
  private mapStatus(status: string | undefined): 'queued' | 'processing' | 'succeeded' | 'failed' {
    console.log(`[KIE] mapStatus input: "${status}" (type: ${typeof status})`);
    if (!status) {
      console.log(`[KIE] mapStatus: status is falsy, returning 'processing'`);
      return 'processing';
    }

    const statusLower = status.toLowerCase().trim();
    console.log(`[KIE] mapStatus lowercase trimmed: "${statusLower}"`);

    let result: 'queued' | 'processing' | 'succeeded' | 'failed';

    if (statusLower.includes('queue') || statusLower.includes('pending')) {
      result = 'queued';
    } else if (statusLower.includes('process') || statusLower.includes('generating') || statusLower.includes('running')) {
      result = 'processing';
    } else if (statusLower.includes('success') || statusLower.includes('succeed') || statusLower.includes('complete') || statusLower.includes('done')) {
      result = 'succeeded';
    } else if (statusLower.includes('fail') || statusLower.includes('error')) {
      result = 'failed';
    } else {
      result = 'processing'; // Default fallback
    }

    console.log(`[KIE] mapStatus result: "${result}"`);
    return result;
  }
}
