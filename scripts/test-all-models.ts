#!/usr/bin/env node
/**
 * Test all KIE model types: image, video, audio, edit
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const TEST_EMAIL = 'all-models-test@example.com';
const TEST_PASSWORD = 'allModelsTest123!';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EDGE_BASE = `${SUPABASE_URL}/functions/v1`;

// Test models by modality
const TEST_MODELS = {
  image: [
    { key: 'google/imagen4-fast', name: 'Google Imagen 4 Fast' },
    { key: 'flux-2/pro-text-to-image', name: 'Flux 2 Pro' },
    { key: 'grok-imagine/text-to-image', name: 'Grok Imagine' },
  ],
  video: [
    { key: 'kling/text-to-video', name: 'Kling Text to Video' },
    { key: 'wan/2-2-a14b-text-to-video-turbo', name: 'Wan 2.2 Turbo' },
  ],
  audio: [
    { key: 'elevenlabs/sound-effect-v2', name: 'ElevenLabs Sound Effect' },
  ],
};

const PROMPTS = {
  image: 'A beautiful sunset over mountains, photorealistic, high quality',
  video: 'A cat walking on a beach, cinematic, 4K quality',
  audio: 'Thunder storm with heavy rain and wind',
};

interface TestResult {
  model: string;
  modality: string;
  status: 'success' | 'failed' | 'timeout';
  duration?: number;
  error?: string;
  previewUrl?: string;
}

async function testModel(
  token: string,
  modelKey: string,
  modelName: string,
  modality: string,
  presetKey: string
): Promise<TestResult> {
  const startTime = Date.now();
  const prompt = PROMPTS[modality as keyof typeof PROMPTS] || PROMPTS.image;
  
  console.log(`\n🔄 Testing ${modelName} (${modelKey})...`);
  
  try {
    // Create generation
    const response = await fetch(`${EDGE_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        presetKey,
        modelKey,
        prompt,
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.log(`   ❌ Create failed: ${result.error || result.message}`);
      return {
        model: modelKey,
        modality,
        status: 'failed',
        error: result.error || result.message,
        duration: Date.now() - startTime,
      };
    }
    
    console.log(`   ✅ Created: ${result.generationId}`);
    console.log(`   📋 Task ID: ${result.providerTaskId}`);
    
    // Poll for status (max 3 minutes for image, 5 minutes for video/audio)
    const maxPolls = modality === 'image' ? 36 : 60;
    const pollInterval = 5000;
    
    for (let i = 0; i < maxPolls; i++) {
      await new Promise(r => setTimeout(r, pollInterval));
      
      const statusRes = await fetch(`${EDGE_BASE}/status?generationId=${result.generationId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const status = await statusRes.json();
      process.stdout.write(`\r   ⏳ Poll ${i + 1}/${maxPolls}: ${status.status}${status.progress ? ` (${status.progress}%)` : ''}     `);
      
      if (status.status === 'succeeded') {
        const duration = Date.now() - startTime;
        console.log(`\n   ✅ Completed in ${(duration / 1000).toFixed(1)}s`);
        return {
          model: modelKey,
          modality,
          status: 'success',
          duration,
          previewUrl: status.signedPreviewUrl,
        };
      }
      
      if (status.status === 'failed') {
        console.log(`\n   ❌ Failed: ${JSON.stringify(status.error)}`);
        return {
          model: modelKey,
          modality,
          status: 'failed',
          error: JSON.stringify(status.error),
          duration: Date.now() - startTime,
        };
      }
    }
    
    console.log(`\n   ⏱️ Timeout after ${maxPolls * pollInterval / 1000}s`);
    return {
      model: modelKey,
      modality,
      status: 'timeout',
      duration: Date.now() - startTime,
    };
    
  } catch (err: any) {
    console.log(`   ❌ Error: ${err.message}`);
    return {
      model: modelKey,
      modality,
      status: 'failed',
      error: err.message,
      duration: Date.now() - startTime,
    };
  }
}

async function main() {
  console.log('🧪 Testing All KIE Models\n');
  console.log('='.repeat(60));
  
  // Auth
  console.log('\n1️⃣ Authenticating...');
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
    { owner_id: data.user!.id, balance: 10000 },
    { onConflict: 'owner_id' }
  );
  
  // Get presets
  console.log('\n2️⃣ Loading presets...');
  const { data: presets } = await supabase
    .from('presets')
    .select('key, type')
    .in('type', ['image', 'video', 'audio']);
  
  const presetMap: Record<string, string> = {};
  for (const p of presets || []) {
    if (!presetMap[p.type]) {
      presetMap[p.type] = p.key;
    }
  }
  console.log('   Presets:', presetMap);
  
  // Check which models exist in DB
  console.log('\n3️⃣ Checking available models...');
  const allModelKeys = [
    ...TEST_MODELS.image.map(m => m.key),
    ...TEST_MODELS.video.map(m => m.key),
    ...TEST_MODELS.audio.map(m => m.key),
  ];
  
  const { data: existingModels } = await supabase
    .from('models')
    .select('key, title, modality')
    .in('key', allModelKeys);
  
  const existingKeys = new Set(existingModels?.map(m => m.key) || []);
  console.log(`   Found ${existingKeys.size}/${allModelKeys.length} models in DB`);
  
  // Test models
  console.log('\n4️⃣ Running tests...');
  console.log('='.repeat(60));
  
  const results: TestResult[] = [];
  
  // Test Image models
  if (presetMap.image) {
    console.log('\n📸 IMAGE MODELS:');
    for (const model of TEST_MODELS.image) {
      if (!existingKeys.has(model.key)) {
        console.log(`\n⚠️ Skipping ${model.name} - not in DB`);
        continue;
      }
      const result = await testModel(token, model.key, model.name, 'image', presetMap.image);
      results.push(result);
    }
  }
  
  // Test Video models
  if (presetMap.video) {
    console.log('\n\n🎬 VIDEO MODELS:');
    for (const model of TEST_MODELS.video) {
      if (!existingKeys.has(model.key)) {
        console.log(`\n⚠️ Skipping ${model.name} - not in DB`);
        continue;
      }
      const result = await testModel(token, model.key, model.name, 'video', presetMap.video);
      results.push(result);
    }
  }
  
  // Test Audio models
  if (presetMap.audio) {
    console.log('\n\n🔊 AUDIO MODELS:');
    for (const model of TEST_MODELS.audio) {
      if (!existingKeys.has(model.key)) {
        console.log(`\n⚠️ Skipping ${model.name} - not in DB`);
        continue;
      }
      const result = await testModel(token, model.key, model.name, 'audio', presetMap.audio);
      results.push(result);
    }
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  const timeout = results.filter(r => r.status === 'timeout');
  
  console.log(`\n✅ Successful: ${successful.length}`);
  for (const r of successful) {
    console.log(`   - ${r.model} (${(r.duration! / 1000).toFixed(1)}s)`);
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    for (const r of failed) {
      console.log(`   - ${r.model}: ${r.error}`);
    }
  }
  
  if (timeout.length > 0) {
    console.log(`\n⏱️ Timeout: ${timeout.length}`);
    for (const r of timeout) {
      console.log(`   - ${r.model}`);
    }
  }
  
  console.log(`\n📈 Success rate: ${successful.length}/${results.length} (${((successful.length / results.length) * 100).toFixed(0)}%)`);
}

main().catch(console.error);
