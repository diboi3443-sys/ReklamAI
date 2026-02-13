#!/usr/bin/env node
/**
 * Test KIE.ai connection via Supabase Edge Functions
 * This tests the full production path: Frontend -> Edge Functions -> KIE API
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testPassword123!';

console.log('🔍 KIE.ai Edge Functions Connection Test');
console.log('='.repeat(60));
console.log(`Supabase URL: ${SUPABASE_URL || 'NOT SET'}`);
console.log(`Edge Functions URL: ${SUPABASE_URL}/functions/v1`);
console.log(`Test Email: ${TEST_EMAIL}`);
console.log('');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  console.error('   Check your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const EDGE_BASE = `${SUPABASE_URL}/functions/v1`;

async function authenticateUser(): Promise<string | null> {
  console.log('1️⃣ Authenticating user...');
  
  // Try to sign in
  let { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error) {
    console.log(`   Sign-in failed: ${error.message}`);
    console.log('   Attempting sign-up...');
    
    const { error: signUpError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (signUpError) {
      console.error(`   ❌ Sign-up failed: ${signUpError.message}`);
      return null;
    }

    // Wait and try sign-in again
    await new Promise(r => setTimeout(r, 2000));
    
    const result = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (result.error || !result.data.session) {
      console.error(`   ❌ Auth failed: ${result.error?.message || 'No session'}`);
      return null;
    }

    data = result.data;
  }

  if (!data?.session?.access_token) {
    console.error('   ❌ No access token');
    return null;
  }

  console.log(`   ✅ Authenticated as: ${data.user?.email}`);
  console.log(`   User ID: ${data.user?.id}`);
  
  // Ensure credit account exists
  const { error: creditError } = await supabase.from('credit_accounts').upsert(
    { owner_id: data.user!.id, balance: 1000 },
    { onConflict: 'owner_id' }
  );
  
  if (creditError) {
    console.log(`   ⚠️ Credit account warning: ${creditError.message}`);
  } else {
    console.log('   ✅ Credit account ensured');
  }

  return data.session.access_token;
}

async function getKieModels(token: string): Promise<any[]> {
  console.log('');
  console.log('2️⃣ Fetching KIE models from database...');

  const { data: models, error } = await supabase
    .from('models')
    .select('id, key, title, modality, provider, capabilities')
    .eq('provider', 'kie')
    .limit(10);

  if (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return [];
  }

  if (!models || models.length === 0) {
    console.log('   ⚠️ No KIE models found in database');
    return [];
  }

  console.log(`   ✅ Found ${models.length} KIE models:`);
  models.forEach((m, i) => {
    const modelId = m.capabilities?.model_identifier || m.key;
    console.log(`      ${i + 1}. ${m.key} → ${modelId} (${m.modality})`);
  });

  return models;
}

async function getImagePreset(token: string): Promise<any | null> {
  console.log('');
  console.log('3️⃣ Fetching image preset...');

  const { data: presets, error } = await supabase
    .from('presets')
    .select('*')
    .eq('type', 'image')
    .limit(1);

  if (error || !presets?.length) {
    console.error(`   ❌ No image preset found: ${error?.message || 'Empty'}`);
    return null;
  }

  console.log(`   ✅ Preset: ${presets[0].key} (${presets[0].title})`);
  return presets[0];
}

async function testGenerateEdgeFunction(
  token: string,
  presetKey: string,
  modelKey: string
): Promise<{ generationId?: string; providerTaskId?: string; error?: string }> {
  console.log('');
  console.log('4️⃣ Testing generate Edge Function...');
  console.log(`   Preset: ${presetKey}`);
  console.log(`   Model: ${modelKey}`);
  console.log(`   URL: ${EDGE_BASE}/generate`);

  const payload = {
    presetKey,
    modelKey,
    prompt: 'Test: A simple red apple on white background, minimalist style',
  };

  console.log(`   Prompt: ${payload.prompt}`);

  try {
    const response = await fetch(`${EDGE_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`   HTTP Status: ${response.status}`);

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`   ❌ Error: ${data.error || data.message || 'Unknown error'}`);
      
      // Check for specific errors
      if (response.status === 500 && data.error?.includes('KIE_API_KEY')) {
        console.error('');
        console.error('   ⚠️ KIE_API_KEY not set in Supabase secrets!');
        console.error('   Run: supabase secrets set KIE_API_KEY=your-key');
      }
      
      if (data.code === 422 || data.message?.includes('422')) {
        console.error('');
        console.error('   ⚠️ KIE returned 422 - Model not supported');
        console.error(`   Model sent: ${data.modelSent || modelKey}`);
        console.error(`   Hint: ${data.hint || 'Check KIE.ai market'}`);
      }
      
      console.log('   Full response:', JSON.stringify(data, null, 2));
      return { error: data.error || data.message || 'Unknown error' };
    }

    console.log(`   ✅ Generation created!`);
    console.log(`   Generation ID: ${data.generationId}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Provider Task ID: ${data.providerTaskId || 'N/A'}`);

    return {
      generationId: data.generationId,
      providerTaskId: data.providerTaskId,
    };
  } catch (error: any) {
    console.error(`   ❌ Request failed: ${error.message}`);
    return { error: error.message };
  }
}

async function testStatusEdgeFunction(
  token: string,
  generationId: string
): Promise<{ status?: string; error?: string }> {
  console.log('');
  console.log(`5️⃣ Testing status Edge Function (${generationId})...`);

  try {
    const response = await fetch(
      `${EDGE_BASE}/status?generationId=${generationId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`   HTTP Status: ${response.status}`);

    const data = await response.json();

    if (!response.ok) {
      console.error(`   ❌ Error: ${data.error || 'Unknown'}`);
      return { error: data.error };
    }

    console.log(`   ✅ Status: ${data.status}`);
    if (data.progress) console.log(`   Progress: ${data.progress}%`);
    if (data.signedPreviewUrl) console.log(`   Preview URL: Available`);
    if (data.error) console.log(`   ⚠️ Provider error: ${JSON.stringify(data.error)}`);

    return { status: data.status };
  } catch (error: any) {
    console.error(`   ❌ Request failed: ${error.message}`);
    return { error: error.message };
  }
}

async function pollStatus(
  token: string,
  generationId: string,
  maxAttempts = 24
): Promise<void> {
  console.log('');
  console.log(`6️⃣ Polling status until completion (max ${maxAttempts * 5}s)...`);

  for (let i = 1; i <= maxAttempts; i++) {
    process.stdout.write(`   Attempt ${i}/${maxAttempts}... `);

    try {
      const response = await fetch(
        `${EDGE_BASE}/status?generationId=${generationId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`${data.status}`);

        if (data.status === 'succeeded') {
          console.log('');
          console.log('   🎉 GENERATION COMPLETED!');
          if (data.signedPreviewUrl) {
            console.log(`   🖼️ Preview: ${data.signedPreviewUrl.substring(0, 100)}...`);
          }
          return;
        }

        if (data.status === 'failed') {
          console.log('');
          console.log(`   ❌ GENERATION FAILED: ${JSON.stringify(data.error)}`);
          return;
        }
      } else {
        const data = await response.json();
        console.log(`error: ${data.error || response.status}`);
      }
    } catch (error: any) {
      console.log(`error: ${error.message}`);
    }

    if (i < maxAttempts) {
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log('');
  console.log('   ⏰ Timeout - task still processing');
}

async function main() {
  // Step 1: Authenticate
  const token = await authenticateUser();
  if (!token) {
    console.log('');
    console.log('='.repeat(60));
    console.log('❌ FAILED: Could not authenticate');
    console.log('='.repeat(60));
    process.exit(1);
  }

  // Step 2: Get KIE models
  const models = await getKieModels(token);

  // Step 3: Get preset
  const preset = await getImagePreset(token);
  if (!preset) {
    process.exit(1);
  }

  // Step 4: Test generate
  let modelKey: string;
  if (models.length > 0) {
    // Use first image model from database
    const imageModel = models.find(m => m.modality === 'image');
    modelKey = imageModel?.key || models[0].key;
  } else {
    // Fallback to a default model
    modelKey = 'grok-imagine';
    console.log(`   Using fallback model: ${modelKey}`);
  }

  const generateResult = await testGenerateEdgeFunction(token, preset.key, modelKey);

  if (generateResult.error) {
    console.log('');
    console.log('='.repeat(60));
    console.log('❌ GENERATE FAILED');
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check KIE_API_KEY is set in Supabase secrets');
    console.log('2. Check model exists in database and is correct');
    console.log('3. Check Edge Functions are deployed');
    console.log('='.repeat(60));
    process.exit(1);
  }

  // Step 5: Test status
  if (generateResult.generationId) {
    await testStatusEdgeFunction(token, generateResult.generationId);

    // Step 6: Poll until complete
    await pollStatus(token, generateResult.generationId);
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('✅ KIE.ai Edge Functions test complete!');
  console.log('='.repeat(60));
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
