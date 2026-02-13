#!/usr/bin/env node
/**
 * Test Flux Kontext generation specifically
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const TEST_EMAIL = 'flux-test@example.com';
const TEST_PASSWORD = 'fluxTest123!';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EDGE_BASE = `${SUPABASE_URL}/functions/v1`;

async function main() {
  console.log('🔍 Testing Flux Kontext Generation\n');
  
  // Auth
  console.log('1️⃣ Authenticating...');
  let { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  
  if (error) {
    console.log('   Creating user...');
    await supabase.auth.signUp({ email: TEST_EMAIL, password: TEST_PASSWORD });
    await new Promise(r => setTimeout(r, 2000));
    const result = await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
    if (result.error) {
      console.error('❌ Auth failed:', result.error.message);
      return;
    }
    data = result.data;
  }
  
  const token = data?.session?.access_token;
  if (!token) {
    console.error('❌ No token');
    return;
  }
  console.log('✅ Authenticated');
  
  // Ensure credits
  await supabase.from('credit_accounts').upsert(
    { owner_id: data.user!.id, balance: 1000 },
    { onConflict: 'owner_id' }
  );
  
  // Get Flux model
  console.log('\n2️⃣ Getting Flux Kontext model...');
  const { data: model } = await supabase
    .from('models')
    .select('*')
    .eq('key', 'flux-kontext-pro')
    .single();
  
  if (!model) {
    console.error('❌ flux-kontext-pro model not found');
    return;
  }
  
  console.log('✅ Found model:', model.key);
  console.log('   Model identifier:', model.capabilities?.model_identifier);
  console.log('   Family:', model.capabilities?.family);
  console.log('   Capabilities:', JSON.stringify(model.capabilities, null, 2));
  
  // Get preset
  const { data: preset } = await supabase
    .from('presets')
    .select('key')
    .eq('type', 'image')
    .limit(1)
    .single();
  
  if (!preset) {
    console.error('❌ No image preset');
    return;
  }
  
  // Create generation
  console.log('\n3️⃣ Creating Flux generation...');
  const payload = {
    presetKey: preset.key,
    modelKey: 'flux-kontext-pro',
    prompt: 'A beautiful sunset over mountains, photorealistic, high quality',
  };
  
  console.log('   Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(`${EDGE_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    console.log('   HTTP Status:', response.status);
    
    const result = await response.json();
    console.log('   Response:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.error('❌ Generation failed:', result.error || result.message);
      
      if (result.code === 422) {
        console.log('\n⚠️  Model not supported error. Checking endpoint config...');
        console.log('   Model sent:', result.modelSent);
        console.log('   API family:', result.apiFamily);
        console.log('   Endpoint used:', result.endpointPath);
        console.log('   Hint:', result.hint);
      }
      return;
    }
    
    console.log('✅ Generation created!');
    console.log('   Generation ID:', result.generationId);
    console.log('   Provider Task ID:', result.providerTaskId);
    
    // Poll for status (longer polling for Flux Kontext - can take a few minutes)
    console.log('\n4️⃣ Polling status (up to 5 minutes)...');
    for (let i = 0; i < 60; i++) { // 60 * 5 sec = 5 minutes
      await new Promise(r => setTimeout(r, 5000));
      
      const statusRes = await fetch(`${EDGE_BASE}/status?generationId=${result.generationId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const status = await statusRes.json();
      console.log(`   Poll ${i + 1}: ${status.status}`);
      
      if (status.status === 'succeeded') {
        console.log('✅ Completed!');
        if (status.signedPreviewUrl) {
          console.log('   Preview URL:', status.signedPreviewUrl.substring(0, 80) + '...');
        }
        break;
      }
      
      if (status.status === 'failed') {
        console.log('❌ Failed:', JSON.stringify(status.error));
        break;
      }
    }
    
  } catch (err: any) {
    console.error('❌ Error:', err.message);
  }
}

main();
