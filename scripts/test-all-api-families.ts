#!/usr/bin/env node
/**
 * Test all KIE API families
 * Tests one model from each API family to verify configuration
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const TEST_EMAIL = 'all-models-test@example.com';
const TEST_PASSWORD = 'allModelsTest123!';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Test configurations for each API family
const TESTS = [
  // === MARKET API (most models) ===
  {
    name: 'Market API - Image (Flux 2)',
    modelKey: 'flux-2/pro-text-to-image',
    presetKey: 'image-gen',
    prompt: 'A crystal ball showing galaxy inside, purple nebula, stars, magical, 4K',
    expectedFamily: 'market',
    timeout: 60000,
  },
  {
    name: 'Market API - Video (Wan Turbo)',
    modelKey: 'wan/2-2-a14b-text-to-video-turbo',
    presetKey: 'video-gen',
    prompt: 'A butterfly landing on a flower in slow motion',
    expectedFamily: 'market',
    timeout: 120000,
  },
  {
    name: 'Market API - Audio (ElevenLabs)',
    modelKey: 'elevenlabs/sound-effect-v2',
    presetKey: 'audio-gen',
    prompt: 'Wind blowing through autumn leaves',
    expectedFamily: 'market',
    timeout: 30000,
  },
  
  // === SPECIAL APIs (require callbacks) ===
  {
    name: 'Veo3 API - Video',
    modelKey: 'veo3_fast',
    presetKey: 'video-gen',
    prompt: 'A hummingbird flying in slow motion',
    expectedFamily: 'veo3',
    requiresCallback: true,
    timeout: 180000,
  },
  {
    name: 'Runway API - Video',
    modelKey: 'gen3a_turbo',
    presetKey: 'video-gen',
    prompt: 'Ocean waves crashing on rocky shore at sunset',
    expectedFamily: 'runway',
    requiresCallback: true,
    timeout: 180000,
  },
  {
    name: 'Luma API - Video',
    modelKey: 'luma-ray-2',
    presetKey: 'video-gen',
    prompt: 'Northern lights dancing over snowy mountains',
    expectedFamily: 'luma',
    requiresCallback: true,
    timeout: 180000,
  },
  {
    name: 'Flux Kontext API - Image',
    modelKey: 'flux-kontext-pro',
    presetKey: 'image-gen',
    prompt: 'A steampunk pocket watch with glowing gears',
    expectedFamily: 'flux-kontext',
    requiresCallback: true,
    timeout: 120000,
  },
  {
    name: '4o Image API',
    modelKey: 'gpt-image-1',
    presetKey: 'image-gen',
    prompt: 'A neon sign saying "OPEN 24/7" in retro style',
    expectedFamily: '4o-image',
    requiresCallback: true,
    timeout: 120000,
  },
  {
    name: 'Suno API - Music',
    modelKey: 'chirp-v4',
    presetKey: 'audio-gen',
    prompt: 'Happy upbeat electronic dance music with energetic synths',
    expectedFamily: 'suno',
    requiresCallback: true,
    timeout: 180000,
  },
];

interface TestResult {
  name: string;
  modelKey: string;
  family: string;
  status: 'success' | 'failed' | 'skipped';
  generationId?: string;
  finalStatus?: string;
  error?: string;
  duration?: number;
}

async function authenticate(): Promise<string | null> {
  console.log('\n🔐 Authenticating...');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  
  if (error || !data.session) {
    console.log('❌ Auth failed, creating test user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    if (signUpError) {
      console.error('❌ Cannot create test user:', signUpError.message);
      return null;
    }
    
    return signUpData.session?.access_token || null;
  }
  
  console.log('✅ Authenticated');
  return data.session.access_token;
}

async function createGeneration(token: string, test: typeof TESTS[0]): Promise<{ generationId?: string; error?: string }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      presetKey: test.presetKey,
      modelKey: test.modelKey,
      prompt: test.prompt,
    }),
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    return { error: result.message || result.error || `HTTP ${response.status}` };
  }
  
  return { generationId: result.generationId };
}

async function pollStatus(token: string, generationId: string, timeout: number): Promise<{ status: string; error?: string }> {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds
  
  while (Date.now() - startTime < timeout) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/status?generationId=${generationId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const data = await response.json();
    const status = data.status;
    
    if (status === 'succeeded') {
      return { status: 'succeeded' };
    }
    
    if (status === 'failed') {
      return { status: 'failed', error: data.error };
    }
    
    console.log(`   📊 ${status}...`);
    await new Promise(r => setTimeout(r, pollInterval));
  }
  
  return { status: 'timeout', error: `Timeout after ${timeout/1000}s` };
}

async function runTest(token: string, test: typeof TESTS[0]): Promise<TestResult> {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🧪 ${test.name}`);
  console.log(`   Model: ${test.modelKey}`);
  console.log(`   Family: ${test.expectedFamily}${test.requiresCallback ? ' (callback)' : ''}`);
  
  const startTime = Date.now();
  
  try {
    // Create generation
    console.log('   📤 Creating generation...');
    const createResult = await createGeneration(token, test);
    
    if (createResult.error) {
      return {
        name: test.name,
        modelKey: test.modelKey,
        family: test.expectedFamily,
        status: 'failed',
        error: createResult.error,
        duration: Date.now() - startTime,
      };
    }
    
    console.log(`   ✅ Created: ${createResult.generationId}`);
    
    // Poll status
    console.log('   ⏳ Polling status...');
    const statusResult = await pollStatus(token, createResult.generationId!, test.timeout);
    
    const duration = Date.now() - startTime;
    
    if (statusResult.status === 'succeeded') {
      console.log(`   ✅ Success! (${(duration/1000).toFixed(1)}s)`);
      return {
        name: test.name,
        modelKey: test.modelKey,
        family: test.expectedFamily,
        status: 'success',
        generationId: createResult.generationId,
        finalStatus: 'succeeded',
        duration,
      };
    } else {
      console.log(`   ❌ ${statusResult.status}: ${statusResult.error || 'Unknown error'}`);
      return {
        name: test.name,
        modelKey: test.modelKey,
        family: test.expectedFamily,
        status: 'failed',
        generationId: createResult.generationId,
        finalStatus: statusResult.status,
        error: statusResult.error,
        duration,
      };
    }
  } catch (error: any) {
    return {
      name: test.name,
      modelKey: test.modelKey,
      family: test.expectedFamily,
      status: 'failed',
      error: error.message,
      duration: Date.now() - startTime,
    };
  }
}

async function main() {
  console.log('🚀 Testing all KIE API families');
  console.log('═'.repeat(60));
  
  // Authenticate
  const token = await authenticate();
  if (!token) {
    console.error('❌ Authentication failed, aborting tests');
    process.exit(1);
  }
  
  // Parse command line args
  const args = process.argv.slice(2);
  const onlyMarket = args.includes('--market-only');
  const onlySpecial = args.includes('--special-only');
  const specificFamily = args.find(a => a.startsWith('--family='))?.split('=')[1];
  const quickMode = args.includes('--quick');
  
  // Filter tests
  let testsToRun = TESTS;
  if (onlyMarket) {
    testsToRun = TESTS.filter(t => t.expectedFamily === 'market');
    console.log('\n⚡ Running Market API tests only');
  } else if (onlySpecial) {
    testsToRun = TESTS.filter(t => t.requiresCallback);
    console.log('\n⚡ Running Special API tests only');
  } else if (specificFamily) {
    testsToRun = TESTS.filter(t => t.expectedFamily === specificFamily);
    console.log(`\n⚡ Running ${specificFamily} API tests only`);
  }
  
  if (quickMode) {
    // Only run first test from each unique family
    const seenFamilies = new Set<string>();
    testsToRun = testsToRun.filter(t => {
      if (seenFamilies.has(t.expectedFamily)) return false;
      seenFamilies.add(t.expectedFamily);
      return true;
    });
    console.log('\n⚡ Quick mode: testing one model per family');
  }
  
  console.log(`\n📋 Running ${testsToRun.length} tests`);
  
  // Run tests
  const results: TestResult[] = [];
  
  for (const test of testsToRun) {
    const result = await runTest(token, test);
    results.push(result);
  }
  
  // Print summary
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  
  const succeeded = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  const skipped = results.filter(r => r.status === 'skipped');
  
  // Group by family
  const byFamily = new Map<string, TestResult[]>();
  for (const r of results) {
    const arr = byFamily.get(r.family) || [];
    arr.push(r);
    byFamily.set(r.family, arr);
  }
  
  console.log('\n📁 By API Family:');
  for (const [family, familyResults] of byFamily.entries()) {
    const successCount = familyResults.filter(r => r.status === 'success').length;
    const emoji = successCount === familyResults.length ? '✅' : successCount > 0 ? '⚠️' : '❌';
    console.log(`   ${emoji} ${family.toUpperCase()}: ${successCount}/${familyResults.length}`);
    for (const r of familyResults) {
      const statusEmoji = r.status === 'success' ? '✅' : r.status === 'failed' ? '❌' : '⏭️';
      const duration = r.duration ? ` (${(r.duration/1000).toFixed(1)}s)` : '';
      console.log(`      ${statusEmoji} ${r.modelKey}${duration}`);
      if (r.error) {
        console.log(`         └─ ${r.error.substring(0, 60)}${r.error.length > 60 ? '...' : ''}`);
      }
    }
  }
  
  console.log('\n📈 Overall:');
  console.log(`   ✅ Succeeded: ${succeeded.length}`);
  console.log(`   ❌ Failed: ${failed.length}`);
  console.log(`   ⏭️  Skipped: ${skipped.length}`);
  
  // Exit with error if any failed
  if (failed.length > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  }
  
  console.log('\n✅ All tests passed!');
}

main().catch(console.error);
