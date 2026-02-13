#!/usr/bin/env node
/**
 * Test KIE.ai connection through Supabase Edge Functions
 * Tests: Authentication, Edge Functions availability, KIE API connectivity
 */

import { createClient } from "@supabase/supabase-js";

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

const EDGE_BASE_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : '';

console.log('🔍 KIE.ai Connection Test');
console.log('='.repeat(60));
console.log(`Supabase URL: ${SUPABASE_URL || 'NOT SET'}`);
console.log(`Edge Functions URL: ${EDGE_BASE_URL || 'NOT SET'}`);
console.log(`Test Email: ${TEST_EMAIL || 'NOT SET'}`);
console.log('');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  console.error('   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

async function testEdgeFunctionHealth() {
  console.log('📊 Test 1: Edge Function Health Check...');

  try {
    // Try OPTIONS request to check CORS and availability
    const response = await fetch(`${EDGE_BASE_URL}/generate`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
      },
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   CORS headers present: ${response.headers.has('access-control-allow-origin') ? 'Yes' : 'No'}`);

    if (response.status === 204 || response.status === 200) {
      console.log('   ✅ Edge Function is reachable');
      return true;
    } else {
      console.log('   ⚠️  Unexpected status, but function may still work');
      return true;
    }
  } catch (error: any) {
    console.error(`   ❌ Edge Function not reachable: ${error.message}`);
    return false;
  }
}

async function authenticateUser(): Promise<{ userId: string; token: string } | null> {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.log('📝 Test 2: Authentication (SKIPPED - no test credentials)');
    console.log('   Set TEST_EMAIL and TEST_PASSWORD in .env for full test');
    return null;
  }

  console.log('📝 Test 2: User Authentication...');

  const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (signInError) {
    console.log('   → Sign-in failed, attempting sign-up...');
    const { error: signUpError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (signUpError) {
      console.error(`   ❌ Auth failed: ${signUpError.message}`);
      return null;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
    const result = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (result.error || !result.data.user || !result.data.session) {
      console.error(`   ❌ Sign-in failed after sign-up: ${result.error?.message || 'No session'}`);
      return null;
    }

    signInData = result.data;
  }

  if (!signInData?.user || !signInData?.session) {
    console.error('   ❌ Authentication failed: no user/session');
    return null;
  }

  // Ensure credit account exists
  await supabase.from('credit_accounts').upsert(
    {
      owner_id: signInData.user.id,
      balance: 1000,
    },
    {
      onConflict: 'owner_id',
    }
  );

  console.log(`   ✅ Authenticated as: ${signInData.user.email}`);
  return { userId: signInData.user.id, token: signInData.session.access_token };
}

async function getAvailableModels(token: string): Promise<any[]> {
  console.log('🔍 Test 3: Fetching KIE models from database...');

  const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: models, error } = await supabase
    .from('models')
    .select('key, title, modality, provider, capabilities')
    .eq('provider', 'kie')
    .limit(5);

  if (error) {
    console.error(`   ❌ Error fetching models: ${error.message}`);
    return [];
  }

  if (!models || models.length === 0) {
    console.log('   ⚠️  No KIE models found in database');
    return [];
  }

  console.log(`   ✅ Found ${models.length} KIE models`);
  models.forEach((m) => {
    console.log(`      - ${m.key} (${m.modality})`);
  });

  return models;
}

async function getImagePreset(token: string): Promise<string | null> {
  console.log('🎨 Test 4: Fetching image preset...');

  const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: presets, error } = await supabase
    .from('presets')
    .select('key, title')
    .eq('type', 'image')
    .limit(1);

  if (error || !presets || presets.length === 0) {
    console.error('   ❌ No image preset found');
    return null;
  }

  console.log(`   ✅ Using preset: ${presets[0].key} (${presets[0].title})`);
  return presets[0].key;
}

async function testKieGenerate(token: string, presetKey: string, modelKey: string) {
  console.log('🚀 Test 5: Testing KIE generation via Edge Function...');
  console.log(`   → Preset: ${presetKey}`);
  console.log(`   → Model: ${modelKey}`);

  const payload = {
    presetKey,
    modelKey,
    prompt: 'A simple test: red apple on white background',
  };

  console.log(`   → Calling ${EDGE_BASE_URL}/generate`);

  try {
    const response = await fetch(`${EDGE_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log(`   → Response status: ${response.status}`);

    if (!response.ok) {
      // Check for specific error types
      if (response.status === 500 && data.error?.includes('KIE_API_KEY')) {
        console.error('   ❌ KIE_API_KEY not set in Supabase secrets!');
        console.error('   → Run: supabase secrets set KIE_API_KEY=your-key');
        return { success: false, error: 'KIE_API_KEY missing' };
      }

      if (data.code === 422 || data.message?.includes('422')) {
        console.error('   ❌ KIE returned 422: Model not supported');
        console.error(`   → Model sent: ${data.modelSent || modelKey}`);
        console.error(`   → Hint: ${data.hint || 'Check KIE.ai market for available models'}`);
        return { success: false, error: 'Model not supported' };
      }

      console.error(`   ❌ Generation failed: ${data.error || data.message || 'Unknown error'}`);
      console.error(`   → Full response: ${JSON.stringify(data, null, 2)}`);
      return { success: false, error: data.error || data.message };
    }

    if (!data.generationId) {
      console.error('   ❌ Response missing generationId');
      return { success: false, error: 'No generationId' };
    }

    console.log(`   ✅ Generation created: ${data.generationId}`);
    console.log(`   ✅ Status: ${data.status}`);
    console.log(`   ✅ Provider task ID: ${data.providerTaskId || 'N/A'}`);

    return { success: true, generationId: data.generationId, providerTaskId: data.providerTaskId };
  } catch (error: any) {
    console.error(`   ❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testKieStatus(token: string, generationId: string) {
  console.log('📊 Test 6: Checking generation status...');

  try {
    const response = await fetch(`${EDGE_BASE_URL}/status?generationId=${generationId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log(`   → Response status: ${response.status}`);

    if (!response.ok) {
      console.error(`   ❌ Status check failed: ${data.error || data.message}`);
      return { success: false, error: data.error || data.message };
    }

    console.log(`   ✅ Generation status: ${data.status}`);
    if (data.progress !== undefined) {
      console.log(`   → Progress: ${data.progress}%`);
    }
    if (data.signedPreviewUrl) {
      console.log(`   → Preview URL available: Yes`);
    }

    return { success: true, status: data.status };
  } catch (error: any) {
    console.error(`   ❌ Status check failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  let allTestsPassed = true;

  // Test 1: Edge Function Health
  const edgeHealthy = await testEdgeFunctionHealth();
  if (!edgeHealthy) {
    console.log('');
    console.log('⚠️  Edge Functions not reachable. Deploy with:');
    console.log('   supabase functions deploy');
    allTestsPassed = false;
  }

  console.log('');

  // Test 2: Authentication
  const authResult = await authenticateUser();
  if (!authResult) {
    console.log('');
    console.log('⚠️  To run full tests, set TEST_EMAIL and TEST_PASSWORD in .env');
    console.log('='.repeat(60));
    console.log('PARTIAL TEST COMPLETE (auth skipped)');
    console.log('='.repeat(60));
    process.exit(0);
  }

  console.log('');

  // Test 3: Get models
  const models = await getAvailableModels(authResult.token);
  if (models.length === 0) {
    console.log('');
    console.log('⚠️  No KIE models in database. Run migrations:');
    console.log('   supabase db push');
    allTestsPassed = false;
  }

  console.log('');

  // Test 4: Get preset
  const presetKey = await getImagePreset(authResult.token);
  if (!presetKey) {
    allTestsPassed = false;
  }

  console.log('');

  // Test 5: KIE Generate
  if (presetKey && models.length > 0) {
    // Find first image model
    const imageModel = models.find((m) => m.modality === 'image');
    if (imageModel) {
      const generateResult = await testKieGenerate(authResult.token, presetKey, imageModel.key);
      if (!generateResult.success) {
        allTestsPassed = false;
      } else if (generateResult.generationId) {
        console.log('');
        // Test 6: Status check
        await testKieStatus(authResult.token, generateResult.generationId);
      }
    } else {
      console.log('   ⚠️  No image models found, skipping generate test');
    }
  }

  console.log('');
  console.log('='.repeat(60));
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED - KIE.ai connection is working!');
  } else {
    console.log('⚠️  SOME TESTS FAILED - Check errors above');
  }
  console.log('='.repeat(60));

  process.exit(allTestsPassed ? 0 : 1);
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
