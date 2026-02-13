#!/usr/bin/env node
/**
 * Test Flux-2 generation (Market API - should work with polling)
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const TEST_EMAIL = 'flux2-test@example.com';
const TEST_PASSWORD = 'flux2Test123!';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EDGE_BASE = `${SUPABASE_URL}/functions/v1`;

async function main() {
  console.log('🔍 Testing Flux-2 Pro (Market API)\n');
  
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
  
  // Get Flux-2 model
  console.log('\n2️⃣ Getting Flux-2 model...');
  const { data: model } = await supabase
    .from('models')
    .select('*')
    .eq('key', 'flux-2/pro-text-to-image')
    .single();
  
  if (!model) {
    console.error('❌ flux-2/pro-text-to-image model not found');
    return;
  }
  
  console.log('✅ Found model:', model.key);
  console.log('   Family:', model.capabilities?.family);
  
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
  console.log('\n3️⃣ Creating Flux-2 generation...');
  const payload = {
    presetKey: preset.key,
    modelKey: 'flux-2/pro-text-to-image',
    prompt: 'A beautiful mountain landscape at sunset, golden hour lighting, photorealistic',
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
      return;
    }
    
    console.log('✅ Generation created!');
    console.log('   Generation ID:', result.generationId);
    console.log('   Provider Task ID:', result.providerTaskId);
    
    // Poll for status (Market API should work with polling)
    console.log('\n4️⃣ Polling status (up to 3 minutes)...');
    for (let i = 0; i < 36; i++) { // 36 * 5 sec = 3 minutes
      await new Promise(r => setTimeout(r, 5000));
      
      const statusRes = await fetch(`${EDGE_BASE}/status?generationId=${result.generationId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const status = await statusRes.json();
      console.log(`   Poll ${i + 1}: ${status.status}${status.progress ? ` (${status.progress}%)` : ''}`);
      
      if (status.status === 'succeeded') {
        console.log('\n✅ Generation completed!');
        if (status.signedPreviewUrl) {
          console.log('   Preview URL:', status.signedPreviewUrl.substring(0, 80) + '...');
        }
        break;
      }
      
      if (status.status === 'failed') {
        console.log('\n❌ Generation failed:', JSON.stringify(status.error));
        break;
      }
    }
    
  } catch (err: any) {
    console.error('❌ Error:', err.message);
  }
}

main();
