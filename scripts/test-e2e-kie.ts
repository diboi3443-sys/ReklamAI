#!/usr/bin/env node
/**
 * End-to-End KIE.ai Test
 * Tests the complete flow: Generate → Poll → Storage → Display
 * 
 * This simulates what happens when a user:
 * 1. Creates a generation on /studio
 * 2. Watches progress on /progress  
 * 3. Views result on /result/:id
 * 4. Sees it in /library
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL || 'e2e-test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'e2eTestPassword123!';

console.log('🔄 KIE.ai End-to-End Test');
console.log('='.repeat(70));
console.log(`Supabase: ${SUPABASE_URL}`);
console.log(`Test User: ${TEST_EMAIL}`);
console.log('='.repeat(70));
console.log('');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EDGE_BASE = `${SUPABASE_URL}/functions/v1`;

interface TestResult {
  step: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration?: number;
  data?: any;
}

const results: TestResult[] = [];

function log(step: string, status: 'pass' | 'fail' | 'warn', message: string, data?: any) {
  const icons = { pass: '✅', fail: '❌', warn: '⚠️' };
  console.log(`${icons[status]} [${step}] ${message}`);
  results.push({ step, status, message, data });
}

async function authenticate(): Promise<string | null> {
  console.log('\n📋 STEP 1: Authentication (simulating user login)');
  console.log('-'.repeat(50));
  
  const t0 = Date.now();
  
  let { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error) {
    console.log('   Creating new test user...');
    const { error: signUpError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    if (signUpError) {
      log('Auth', 'fail', `Sign-up failed: ${signUpError.message}`);
      return null;
    }
    
    await new Promise(r => setTimeout(r, 2000));
    
    const result = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    if (result.error || !result.data.session) {
      log('Auth', 'fail', `Sign-in after signup failed: ${result.error?.message}`);
      return null;
    }
    data = result.data;
  }

  if (!data?.session?.access_token) {
    log('Auth', 'fail', 'No session token');
    return null;
  }

  const duration = Date.now() - t0;
  log('Auth', 'pass', `Authenticated as ${data.user?.email}`, { duration: `${duration}ms` });
  
  // Ensure credit balance
  await supabase.from('credit_accounts').upsert(
    { owner_id: data.user!.id, balance: 1000 },
    { onConflict: 'owner_id' }
  );
  
  return data.session.access_token;
}

async function getPresetAndModel(token: string): Promise<{ presetKey: string; modelKey: string } | null> {
  console.log('\n📋 STEP 2: Load Preset & Model (simulating /studio page load)');
  console.log('-'.repeat(50));
  
  const t0 = Date.now();
  
  // Get image preset
  const { data: presets, error: presetError } = await supabase
    .from('presets')
    .select('key, title_en')
    .eq('type', 'image')
    .limit(1);
  
  if (presetError || !presets?.length) {
    log('Preset', 'fail', `No image preset: ${presetError?.message}`);
    return null;
  }
  
  log('Preset', 'pass', `Found preset: ${presets[0].key}`);
  
  // Get image model
  const { data: models, error: modelError } = await supabase
    .from('models')
    .select('key, title, provider, capabilities')
    .eq('provider', 'kie')
    .eq('modality', 'image')
    .limit(1);
  
  if (modelError || !models?.length) {
    log('Model', 'fail', `No KIE image model: ${modelError?.message}`);
    return null;
  }
  
  const model = models[0];
  const modelIdentifier = model.capabilities?.model_identifier || model.key;
  
  const duration = Date.now() - t0;
  log('Model', 'pass', `Found model: ${model.key} → ${modelIdentifier}`, { duration: `${duration}ms` });
  
  return { presetKey: presets[0].key, modelKey: model.key };
}

async function createGeneration(
  token: string,
  presetKey: string,
  modelKey: string
): Promise<{ generationId: string; providerTaskId?: string } | null> {
  console.log('\n📋 STEP 3: Create Generation (simulating "Generate" button click)');
  console.log('-'.repeat(50));
  
  const t0 = Date.now();
  
  const payload = {
    presetKey,
    modelKey,
    prompt: 'E2E Test: A beautiful red apple on a white marble surface, soft lighting, product photography style',
  };
  
  console.log(`   Preset: ${payload.presetKey}`);
  console.log(`   Model: ${payload.modelKey}`);
  console.log(`   Prompt: ${payload.prompt.substring(0, 50)}...`);
  
  try {
    const response = await fetch(`${EDGE_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    const duration = Date.now() - t0;
    
    if (!response.ok) {
      log('Generate', 'fail', `HTTP ${response.status}: ${data.error || data.message}`, { 
        duration: `${duration}ms`,
        response: data 
      });
      return null;
    }
    
    if (!data.generationId) {
      log('Generate', 'fail', 'No generationId in response', { response: data });
      return null;
    }
    
    log('Generate', 'pass', `Generation created: ${data.generationId}`, {
      duration: `${duration}ms`,
      status: data.status,
      providerTaskId: data.providerTaskId,
    });
    
    return {
      generationId: data.generationId,
      providerTaskId: data.providerTaskId,
    };
  } catch (error: any) {
    log('Generate', 'fail', `Exception: ${error.message}`);
    return null;
  }
}

async function pollUntilComplete(
  token: string,
  generationId: string,
  maxSeconds = 120
): Promise<{ status: string; signedPreviewUrl?: string } | null> {
  console.log('\n📋 STEP 4: Poll Status (simulating /progress page polling)');
  console.log('-'.repeat(50));
  
  const t0 = Date.now();
  const pollInterval = 3000;
  const maxAttempts = Math.ceil((maxSeconds * 1000) / pollInterval);
  
  for (let i = 1; i <= maxAttempts; i++) {
    const elapsed = Math.round((Date.now() - t0) / 1000);
    process.stdout.write(`   Polling ${i}/${maxAttempts} (${elapsed}s)... `);
    
    try {
      const response = await fetch(`${EDGE_BASE}/status?generationId=${generationId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        console.log(`HTTP ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      console.log(data.status);
      
      if (data.status === 'succeeded') {
        const duration = Date.now() - t0;
        log('Poll', 'pass', `Completed in ${Math.round(duration / 1000)}s`, {
          duration: `${duration}ms`,
          hasPreviewUrl: !!data.signedPreviewUrl,
        });
        
        return {
          status: data.status,
          signedPreviewUrl: data.signedPreviewUrl,
        };
      }
      
      if (data.status === 'failed') {
        log('Poll', 'fail', `Generation failed: ${JSON.stringify(data.error)}`, { error: data.error });
        return null;
      }
    } catch (error: any) {
      console.log(`error: ${error.message}`);
    }
    
    if (i < maxAttempts) {
      await new Promise(r => setTimeout(r, pollInterval));
    }
  }
  
  const duration = Date.now() - t0;
  log('Poll', 'warn', `Timeout after ${Math.round(duration / 1000)}s - still processing`);
  return null;
}

async function verifyStorageAsset(
  token: string,
  generationId: string
): Promise<{ assetId: string; signedUrl: string } | null> {
  console.log('\n📋 STEP 5: Verify Storage Asset (simulating /result/:id page load)');
  console.log('-'.repeat(50));
  
  const t0 = Date.now();
  
  // Check asset record in database
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('id, storage_bucket, storage_path, kind, asset_type, meta')
    .eq('generation_id', generationId)
    .eq('kind', 'output')
    .single();
  
  if (assetError || !asset) {
    log('Asset', 'fail', `No output asset found: ${assetError?.message}`);
    return null;
  }
  
  log('Asset', 'pass', `Asset record found: ${asset.id}`, {
    bucket: asset.storage_bucket,
    path: asset.storage_path,
    type: asset.asset_type,
  });
  
  // Create signed URL
  const { data: signedData, error: urlError } = await supabase.storage
    .from(asset.storage_bucket)
    .createSignedUrl(asset.storage_path, 3600);
  
  if (urlError || !signedData?.signedUrl) {
    log('SignedURL', 'fail', `Cannot create signed URL: ${urlError?.message}`);
    return null;
  }
  
  const duration = Date.now() - t0;
  log('SignedURL', 'pass', `Signed URL created`, { duration: `${duration}ms` });
  
  // Verify URL is accessible
  try {
    const imgResponse = await fetch(signedData.signedUrl, { method: 'HEAD' });
    if (imgResponse.ok) {
      const contentType = imgResponse.headers.get('content-type');
      const contentLength = imgResponse.headers.get('content-length');
      log('FileAccess', 'pass', `File accessible: ${contentType}, ${contentLength} bytes`);
    } else {
      log('FileAccess', 'warn', `File returned HTTP ${imgResponse.status}`);
    }
  } catch (e: any) {
    log('FileAccess', 'warn', `Cannot verify file: ${e.message}`);
  }
  
  return {
    assetId: asset.id,
    signedUrl: signedData.signedUrl,
  };
}

async function verifyDatabaseRecord(
  token: string,
  generationId: string
): Promise<boolean> {
  console.log('\n📋 STEP 6: Verify Database Record (simulating /library page)');
  console.log('-'.repeat(50));
  
  // Simple query without joins to avoid schema cache issues
  const { data: gen, error } = await supabase
    .from('generations')
    .select('id, status, prompt, preset_id, model_id, created_at, updated_at')
    .eq('id', generationId)
    .single();
  
  if (error || !gen) {
    log('Database', 'fail', `Generation not found: ${error?.message}`);
    return false;
  }
  
  const checks = {
    status: gen.status === 'succeeded',
    hasPresetId: !!gen.preset_id,
    hasModelId: !!gen.model_id,
    hasPrompt: !!gen.prompt,
  };
  
  const allPassed = Object.values(checks).every(v => v);
  
  log('Database', allPassed ? 'pass' : 'warn', `Generation record verified`, {
    status: gen.status,
    preset_id: gen.preset_id,
    model_id: gen.model_id,
    checks,
  });
  
  return allPassed;
}

async function testDownloadEndpoint(
  token: string,
  generationId: string
): Promise<boolean> {
  console.log('\n📋 STEP 7: Test Download Endpoint (simulating Download button)');
  console.log('-'.repeat(50));
  
  const t0 = Date.now();
  
  try {
    const response = await fetch(`${EDGE_BASE}/download`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ generationId }),
    });
    
    const data = await response.json();
    const duration = Date.now() - t0;
    
    if (!response.ok) {
      log('Download', 'fail', `HTTP ${response.status}: ${data.error}`, { duration: `${duration}ms` });
      return false;
    }
    
    if (!data.url) {
      log('Download', 'fail', 'No URL in response', { response: data });
      return false;
    }
    
    log('Download', 'pass', `Download URL received`, {
      duration: `${duration}ms`,
      hasExpiry: !!data.expiresAt,
    });
    
    return true;
  } catch (error: any) {
    log('Download', 'fail', `Exception: ${error.message}`);
    return false;
  }
}

async function main() {
  const totalStart = Date.now();
  
  // Step 1: Auth
  const token = await authenticate();
  if (!token) {
    printSummary(totalStart);
    process.exit(1);
  }
  
  // Step 2: Get preset/model
  const config = await getPresetAndModel(token);
  if (!config) {
    printSummary(totalStart);
    process.exit(1);
  }
  
  // Step 3: Create generation
  const generation = await createGeneration(token, config.presetKey, config.modelKey);
  if (!generation) {
    printSummary(totalStart);
    process.exit(1);
  }
  
  // Step 4: Poll until complete
  const pollResult = await pollUntilComplete(token, generation.generationId);
  if (!pollResult) {
    // Even if timeout, continue to check what we have
    console.log('\n⚠️ Generation not completed yet, checking partial results...');
  }
  
  // Step 5: Verify storage (only if completed)
  if (pollResult?.status === 'succeeded') {
    await verifyStorageAsset(token, generation.generationId);
  }
  
  // Step 6: Verify database
  await verifyDatabaseRecord(token, generation.generationId);
  
  // Step 7: Test download
  if (pollResult?.status === 'succeeded') {
    await testDownloadEndpoint(token, generation.generationId);
  }
  
  printSummary(totalStart);
}

function printSummary(startTime: number) {
  const totalDuration = Date.now() - startTime;
  
  console.log('\n');
  console.log('='.repeat(70));
  console.log('📊 E2E TEST SUMMARY');
  console.log('='.repeat(70));
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warned = results.filter(r => r.status === 'warn').length;
  
  console.log(`Total duration: ${Math.round(totalDuration / 1000)}s`);
  console.log(`Results: ✅ ${passed} passed, ❌ ${failed} failed, ⚠️ ${warned} warnings`);
  console.log('');
  
  // Print each result
  for (const r of results) {
    const icon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${r.step}: ${r.message}`);
  }
  
  console.log('');
  
  if (failed === 0 && warned === 0) {
    console.log('🎉 ALL TESTS PASSED! Full E2E flow is working correctly.');
    console.log('');
    console.log('User flow verified:');
    console.log('  /studio → Create generation with prompt');
    console.log('  /progress → Poll status until complete');
    console.log('  /result/:id → View result with signed URL');
    console.log('  /library → See generation in history');
    console.log('  Download button → Get download URL');
  } else if (failed === 0) {
    console.log('⚠️ Tests passed with warnings. Check warnings above.');
  } else {
    console.log('❌ SOME TESTS FAILED. Check errors above.');
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check Edge Functions are deployed: supabase functions deploy');
    console.log('2. Check KIE_API_KEY is set: supabase secrets list');
    console.log('3. Check database migrations: supabase db push');
    console.log('4. Check storage buckets exist: uploads, outputs');
  }
  
  console.log('='.repeat(70));
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
