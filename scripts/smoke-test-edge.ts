#!/usr/bin/env node
/**
 * Smoke Test for ReklamAI Studio Edge Functions
 * Tests: upload -> generate -> status (poll) -> download
 */

// Load environment variables from .env.smoke
import { config } from 'dotenv';
import { resolve } from 'path';

// Try to load .env.smoke first, then fallback to .env
config({ path: resolve(process.cwd(), '.env.smoke') });
config({ path: resolve(process.cwd(), '.env') });
import { createClient } from '@supabase/supabase-js';

// Auto-fill EDGE_BASE_URL from SUPABASE_URL if not set
if (!process.env.EDGE_BASE_URL && process.env.SUPABASE_URL) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (match) {
    const projectRef = match[1];
    process.env.EDGE_BASE_URL = `https://${projectRef}.supabase.co/functions/v1`;
  }
}

// Validate required environment variables
const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  TEST_EMAIL: process.env.TEST_EMAIL,
  TEST_PASSWORD: process.env.TEST_PASSWORD,
  EDGE_BASE_URL: process.env.EDGE_BASE_URL,
};

const missing = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`  - ${key}`));
  console.error('\n💡 Copy .env.smoke.example to .env.smoke and fill in the values');
  process.exit(1);
}

const { SUPABASE_URL, SUPABASE_ANON_KEY, TEST_EMAIL, TEST_PASSWORD, EDGE_BASE_URL } = requiredEnvVars as Record<string, string>;

// Test state
interface TestState {
  userId?: string;
  accessToken?: string;
  uploadPath?: string;
  generationId?: string;
  finalStatus?: string;
  signedUrl?: string;
}

const state: TestState = {};

// Helper: Make authenticated request to Edge Function
async function callEdgeFunction(
  endpoint: string,
  options: RequestInit & { token: string }
): Promise<Response> {
  const { token, ...fetchOptions } = options;
  const url = `${EDGE_BASE_URL}${endpoint}`;
  
  return fetch(url, {
    ...fetchOptions,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });
}

// Step 1: Authenticate user
async function authenticateUser(): Promise<{ userId: string; token: string }> {
  // Increase timeout for network requests
  const fetchTimeout = 30000; // 30 seconds
  console.log('\n📝 Step 1: Authenticating user...');
  console.log(`  → Using SUPABASE_URL: ${SUPABASE_URL}`);
  console.log(`  → ANON_KEY length: ${SUPABASE_ANON_KEY?.length || 0} chars`);
  console.log(`  → ANON_KEY starts with: ${SUPABASE_ANON_KEY?.substring(0, 50) || 'MISSING'}...`);
  console.log(`  → ANON_KEY ends with: ...${SUPABASE_ANON_KEY?.substring(Math.max(0, (SUPABASE_ANON_KEY?.length || 0) - 50)) || 'MISSING'}`);
  
  // Validate key format
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.length < 100) {
    console.error('  ❌ ANON_KEY seems too short or missing');
    process.exit(1);
  }
  
  if (SUPABASE_ANON_KEY.split('.').length !== 3) {
    console.error(`  ❌ ANON_KEY should have 3 parts (JWT format), got ${SUPABASE_ANON_KEY.split('.').length}`);
    process.exit(1);
  }
  
  // Create Supabase client with increased timeout
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (url, options = {}) => {
        // Increase timeout to 30 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId);
        });
      },
    },
  });
  
  // Test connectivity first
  console.log('  → Testing connectivity to Supabase...');
  try {
    const healthCheck = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
    });
    console.log(`  ✅ Connectivity OK (status: ${healthCheck.status})`);
  } catch (connectError: any) {
    console.error(`  ⚠️  Connectivity test failed: ${connectError.message}`);
    console.error(`  → This might be a network/firewall issue`);
    console.error(`  → Try checking your internet connection or firewall settings`);
    // Continue anyway - might still work
  }
  
  // Try to sign in
  let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL!,
    password: TEST_PASSWORD!,
  });
  
  // If user doesn't exist or invalid credentials, try to sign up
  if (signInError) {
    console.log(`  → Signin error: ${signInError.message}`);
    
    // Check if it's an invalid credentials error or user not found
    if (signInError.message.includes('Invalid login credentials') || 
        signInError.message.includes('Invalid') ||
        signInError.status === 400) {
      console.log('  → Attempting signup (user may not exist)...');
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_EMAIL!,
        password: TEST_PASSWORD!,
      });
      
      if (signUpError) {
        console.error(`  ❌ Signup failed: ${signUpError.message}`);
        console.error(`  Error details: ${JSON.stringify(signUpError, null, 2)}`);
        process.exit(1);
      }
      
      if (!signUpData.user) {
        console.error('  ❌ Signup succeeded but no user returned');
        console.error(`  Signup response: ${JSON.stringify(signUpData, null, 2)}`);
        process.exit(1);
      }
      
      console.log(`  ✅ User created: ${signUpData.user.email}`);
      
      // Wait a moment for user creation, then sign in
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL!,
        password: TEST_PASSWORD!,
      });
      
      if (result.error) {
        console.error(`  ❌ Signin after signup failed: ${result.error.message}`);
        console.error(`  Error details: ${JSON.stringify(result.error, null, 2)}`);
        process.exit(1);
      }
      
      if (!result.data.user || !result.data.session) {
        console.error('  ❌ Signin succeeded but no user/session returned');
        console.error(`  Response: ${JSON.stringify(result.data, null, 2)}`);
        process.exit(1);
      }
      
      signInData = result.data;
    } else {
      // Other error (network, server, etc.)
      console.error(`  ❌ Authentication error: ${signInError.message}`);
      console.error(`  Error status: ${signInError.status || 'unknown'}`);
      console.error(`  Full error: ${JSON.stringify(signInError, null, 2)}`);
      process.exit(1);
    }
  }
  
  if (!signInData?.user || !signInData?.session) {
    console.error('  ❌ Authentication failed: No user or session');
    console.error(`  SignInData: ${JSON.stringify(signInData, null, 2)}`);
    process.exit(1);
  }
  
  state.userId = signInData.user.id;
  state.accessToken = signInData.session.access_token;
  
  console.log(`  ✅ Authenticated as: ${signInData.user.email} (${signInData.user.id})`);
  
  // Ensure credit account exists with balance
  console.log('  → Ensuring credit account exists...');
  const { error: creditError } = await supabase
    .from('credit_accounts')
    .upsert({
      owner_id: signInData.user.id,
      balance: 1000, // Give test user 1000 credits
    }, {
      onConflict: 'owner_id',
    });
  
  if (creditError) {
    console.warn(`  ⚠️  Could not ensure credit account: ${creditError.message}`);
    console.warn(`  → Continuing anyway - RPC function should create account if needed`);
  } else {
    console.log(`  ✅ Credit account ensured (balance: 1000)`);
  }
  
  return { userId: signInData.user.id, token: signInData.session.access_token };
}

// Step 2: Upload test file (two-step: get path, then upload to Storage)
async function uploadTestFile(token: string): Promise<string> {
  console.log('\n📤 Step 2: Uploading test file...');
  
  // Create a small test file
  const testContent = 'reklamai-smoke-test';
  const blob = new Blob([testContent], { type: 'text/plain' });
  const file = new File([blob], 'smoke-test.txt', { type: 'text/plain' });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout (for two steps)
  
  const t0 = Date.now();
  try {
    // Step 2a: Request upload path from Edge Function
    console.log('  → Step 2a: Requesting upload path from Edge Function...');
    console.log(`  → URL: ${EDGE_BASE_URL}/upload`);
    console.log(`  → Token length: ${token.length} chars`);
    console.log(`  → Token starts with: ${token.substring(0, 20)}...`);
    
    const requestBody = {
      purpose: 'startFrame',
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type || 'text/plain',
    };
    console.log(`  → Request body: ${JSON.stringify(requestBody)}`);
    
    // Попробуем сначала с anon key (как в Dashboard примере)
    // Если не сработает, попробуем с access_token
    console.log('  → Trying with anon key first (as in Dashboard example)...');
    
    let pathResponse = await fetch(`${EDGE_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, // Используем anon key как в Dashboard
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    // Если не сработало с anon key, попробуем с access_token
    if (!pathResponse.ok && pathResponse.status === 401) {
      console.log('  → Anon key failed, trying with access_token...');
      pathResponse = await fetch(`${EDGE_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    }
    
    console.log(`  → Response status: ${pathResponse.status}`);
    console.log(`  → Response headers:`, Object.fromEntries(pathResponse.headers.entries()));
    
    if (!pathResponse.ok) {
      const error = await pathResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`  ❌ Failed to get upload path: ${pathResponse.status} - ${JSON.stringify(error)}`);
      process.exit(1);
    }
    
    const pathData = await pathResponse.json();
    if (!pathData.path) {
      console.error(`  ❌ Upload path response missing path: ${JSON.stringify(pathData)}`);
      process.exit(1);
    }
    
    console.log(`  ✅ Upload path obtained: ${pathData.path}`);
    
    // Step 2b: Upload file directly to Storage using Supabase client
    console.log('  → Step 2b: Uploading file to Storage...');
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('  ❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment');
      process.exit(1);
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      },
    });
    
    // Convert File to Blob for upload
    const fileBlob = await file.arrayBuffer();
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(pathData.path, fileBlob, {
        contentType: file.type || 'text/plain',
        upsert: false,
      });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - t0;
    
    if (uploadError) {
      console.error(`  ❌ Storage upload failed after ${duration}ms: ${uploadError.message}`);
      console.error(`  → Error details:`, uploadError);
      process.exit(1);
    }
    
    console.log(`  ✅ Uploaded to Storage: ${pathData.path} (total time: ${duration}ms)`);
    
    state.uploadPath = pathData.path;
    return pathData.path;
  } catch (error: any) {
    clearTimeout(timeoutId);
    const duration = Date.now() - t0;
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        console.error(`  ❌ Upload timeout after ${duration}ms (limit: 60000ms)`);
        console.error(`  → This suggests the function is not responding`);
        console.error(`  → Check function logs in Dashboard for errors`);
        console.error(`  → Verify that Verify JWT is disabled in function settings`);
        process.exit(1);
      }
    console.error(`  ❌ Upload error after ${duration}ms:`, error.message);
    throw error;
  }
}

// Step 3: Get default board and model
async function getDefaultBoardAndModel(token: string): Promise<{ boardId: string | null; presetKey: string; modelKey: string }> {
  console.log('\n🔍 Step 3: Fetching default board and model...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  
  // Get user's first board (or null)
  const { data: boards } = await supabase
    .from('boards')
    .select('id')
    .eq('owner_id', state.userId!)
    .limit(1);
  
  const boardId = boards && boards.length > 0 ? boards[0].id : null;
  
  // Get first image preset and model (cheapest option)
  console.log('  → Fetching presets...');
  const { data: presets, error: presetError } = await supabase
    .from('presets')
    .select('key, type')
    .eq('type', 'image')
    .limit(5);
  
  if (presetError) {
    console.error(`  ❌ Error fetching presets: ${presetError.message}`);
    console.error(`  Preset error details: ${JSON.stringify(presetError)}`);
    process.exit(1);
  }
  
  console.log(`  → Found ${presets?.length || 0} presets`);
  if (!presets || presets.length === 0) {
    console.error('  ❌ No image preset found. Run seed data migration first.');
    process.exit(1);
  }
  
  const preset = presets[0];
  console.log(`  → Using preset: ${preset.key}`);
  
  console.log('  → Fetching models...');
  // Fetch image models, prefer KIE.ai models (provider='kie')
  // Exclude legacy models that start with 'kie-' prefix (old format)
  const { data: models, error: modelError } = await supabase
    .from('models')
    .select('key, modality, provider')
    .eq('modality', 'image')
    .eq('provider', 'kie') // Only KIE.ai models
    .limit(20);
  
  if (modelError) {
    console.error(`  ❌ Error fetching models: ${modelError.message}`);
    console.error(`  Model error details: ${JSON.stringify(modelError)}`);
    console.error(`  Model error code: ${modelError.code}`);
    console.error(`  Model error hint: ${modelError.hint}`);
    process.exit(1);
  }
  
  console.log(`  → Found ${models?.length || 0} models`);
  if (!models || models.length === 0) {
    console.error('  ❌ No KIE.ai image model found. Run migration 20240101000003_kie_models.sql first.');
    console.error('  → This migration seeds all KIE.ai models into the models table.');
    process.exit(1);
  }
  
  // Prefer models that are known to work with KIE Market API
  // Try multiple models in order of preference (based on test results)
  // grok-imagine/text-to-image works but requires aspect_ratio
  const knownWorkingModels = [
    'grok-imagine/text-to-image',  // First - confirmed working (requires aspect_ratio)
    'gpt-image/1.5-text-to-image', // Second - should work with aspect_ratio
    'ideogram/character',           // Third - should work with aspect_ratio
    'flux2/pro-text-to-image',     // Fourth - should work with aspect_ratio
    'flux2/flex-text-to-image',    // Fifth - should work with aspect_ratio
    'z-image',                     // Sixth option
  ];
  
  // Exclude models that are known NOT to work
  const excludedModels = [
    'seedream-v4-text-to-image',   // Not supported by API key
    'seedream-4.5-text-to-image',  // Not supported by API key
  ];
  
  console.log(`  → Available models: ${models.map(m => m.key).join(', ')}`);
  console.log(`  → Looking for preferred models: ${knownWorkingModels.join(', ')}`);
  
  // Find model in priority order (not just first match)
  let preferredModel: typeof models[0] | undefined;
  for (const preferredKey of knownWorkingModels) {
    preferredModel = models.find(m => m.key === preferredKey);
    if (preferredModel) {
      console.log(`  → Found preferred model: ${preferredModel.key}`);
      break;
    }
  }
  
  if (!preferredModel) {
    console.log(`  → No preferred model found, using first available (excluding known bad models)`);
    const realKieModels = models.filter(m => 
      !m.key.startsWith('kie-') && !excludedModels.includes(m.key)
    );
    preferredModel = realKieModels.length > 0 ? realKieModels[0] : models[0];
  }
  
  const model = preferredModel;
  console.log(`  → Using model: ${model.key} (provider: ${model.provider})`);
  
  console.log(`  ✅ Board: ${boardId || 'none (will create default)'}`);
  console.log(`  ✅ Preset: ${preset.key}`);
  console.log(`  ✅ Model: ${model.key}`);
  
  return { boardId, presetKey: preset.key, modelKey: model.key };
}

// Step 4: Create generation
async function createGeneration(
  token: string,
  boardId: string | null,
  presetKey: string,
  modelKey: string,
  uploadPath: string
): Promise<string> {
  console.log('\n🚀 Step 4: Creating generation...');
  
  const payload = {
    presetKey,
    modelKey,
    prompt: 'A beautiful sunset over mountains, cinematic lighting, high quality',
    input: {
      startFramePath: uploadPath, // Use uploaded file as start frame
    },
    ...(boardId && { boardId }),
  };
  
  const response = await callEdgeFunction('/generate', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error(`  ❌ Generation failed: ${response.status} - ${JSON.stringify(error)}`);
    process.exit(1);
  }
  
  const data = await response.json();
  
  if (!data.generationId) {
    console.error(`  ❌ Generation response missing generationId: ${JSON.stringify(data)}`);
    process.exit(1);
  }
  
  state.generationId = data.generationId;
  console.log(`  ✅ Generation created: ${data.generationId}`);
  return data.generationId;
}

// Step 5: Poll status
async function pollStatus(token: string, generationId: string, maxWaitSeconds = 180): Promise<string> {
  console.log('\n⏳ Step 5: Polling generation status...');
  console.log(`  → Polling every 2s for up to ${maxWaitSeconds}s...`);
  
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds
  
  while (true) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    if (elapsed > maxWaitSeconds) {
      console.error(`  ❌ Timeout after ${maxWaitSeconds}s`);
      process.exit(1);
    }
    
    // Use GET with query param (as per status function contract)
    const url = new URL(`${EDGE_BASE_URL}/status`);
    url.searchParams.set('generationId', generationId);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`  ❌ Status check failed: ${response.status} - ${JSON.stringify(error)}`);
      process.exit(1);
    }
    
    const data = await response.json();
    const status = data.status;
    const progress = data.progress;
    
    const progressStr = progress !== undefined ? ` (${progress}%)` : '';
    console.log(`  → [${elapsed}s] Status: ${status}${progressStr}`);
    
    if (status === 'succeeded') {
      state.finalStatus = status;
      console.log(`  ✅ Generation completed successfully!`);
      return status;
    }
    
    if (status === 'failed' || status === 'cancelled') {
      const errorMsg = data.error || 'Unknown error';
      console.error(`  ❌ Generation ${status}: ${errorMsg}`);
      process.exit(1);
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
}

// Step 6: Download result
async function downloadResult(token: string, generationId: string): Promise<string> {
  console.log('\n📥 Step 6: Downloading result...');
  
  const response = await callEdgeFunction('/download', {
    method: 'POST',
    token,
    body: JSON.stringify({ generationId }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error(`  ❌ Download failed: ${response.status} - ${JSON.stringify(error)}`);
    process.exit(1);
  }
  
  const data = await response.json();
  
  if (!data.url) {
    console.error(`  ❌ Download response missing url: ${JSON.stringify(data)}`);
    process.exit(1);
  }
  
  state.signedUrl = data.url;
  console.log(`  ✅ Signed URL obtained (expires: ${data.expiresAt || 'unknown'})`);
  return data.url;
}

// Main execution
async function main() {
  console.log('🧪 ReklamAI Studio Edge Functions Smoke Test');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Authenticate
    const { userId, token } = await authenticateUser();
    
    // Step 2: Upload
    const uploadPath = await uploadTestFile(token);
    
    // Step 3: Get board/model
    const { boardId, presetKey, modelKey } = await getDefaultBoardAndModel(token);
    
    // Step 4: Generate
    const generationId = await createGeneration(token, boardId, presetKey, modelKey, uploadPath);
    
    // Step 5: Poll status
    const finalStatus = await pollStatus(token, generationId);
    
    // Step 6: Download
    const signedUrl = await downloadResult(token, generationId);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SMOKE TEST PASSED');
    console.log('=' .repeat(60));
    console.log('Summary:');
    console.log(`  User ID:        ${state.userId}`);
    console.log(`  Upload Path:    ${state.uploadPath}`);
    console.log(`  Generation ID:  ${state.generationId}`);
    console.log(`  Final Status:   ${state.finalStatus}`);
    console.log(`  Signed URL:     ${state.signedUrl}`);
    console.log('=' .repeat(60));
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ SMOKE TEST FAILED');
    console.error('=' .repeat(60));
    console.error(`Error: ${error.message || error}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.error('=' .repeat(60));
    process.exit(1);
  }
}

main();
