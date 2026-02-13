#!/usr/bin/env tsx
/**
 * Test video generation to debug 502 errors
 * This script tests video model generation through Edge Functions
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testVideoGeneration() {
  console.log('🧪 Testing video generation...\n');

  // Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('❌ Not authenticated. Please login first.');
    process.exit(1);
  }

  console.log(`✅ Authenticated as: ${user.id}\n`);

  // Load video models from database
  console.log('📋 Loading video models from database...');
  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select('*')
    .eq('modality', 'video')
    .eq('provider', 'kie')
    .eq('is_enabled', true)
    .limit(10);

  if (modelsError) {
    console.error('❌ Error loading models:', modelsError);
    return;
  }

  if (!models || models.length === 0) {
    console.error('❌ No video models found in database');
    return;
  }

  console.log(`✅ Found ${models.length} video models:\n`);
  models.forEach((model, idx) => {
    const capabilities = model.capabilities || {};
    console.log(`${idx + 1}. ${model.title} (${model.key})`);
    console.log(`   API Family: ${capabilities.family || 'market'}`);
    console.log(`   Model Identifier: ${capabilities.model_identifier || model.key}`);
    console.log(`   Requires Callback: ${capabilities.requires_callback || false}`);
    console.log('');
  });

  // Test with first video model
  const testModel = models[0];
  const capabilities = testModel.capabilities || {};
  const apiFamily = capabilities.family || 'market';
  const modelIdentifier = capabilities.model_identifier || testModel.key;

  console.log(`🎬 Testing generation with: ${testModel.title}`);
  console.log(`   Model Key: ${testModel.key}`);
  console.log(`   Model Identifier: ${modelIdentifier}`);
  console.log(`   API Family: ${apiFamily}`);
  console.log('');

  // Load video preset
  const { data: presets } = await supabase
    .from('presets')
    .select('*')
    .eq('type', 'video')
    .limit(1);

  if (!presets || presets.length === 0) {
    console.error('❌ No video preset found');
    return;
  }

  const preset = presets[0];
  console.log(`✅ Using preset: ${preset.title_ru || preset.title_en}\n`);

  // Test generation
  console.log('🚀 Testing generation...');
  try {
    const { data, error } = await supabase.functions.invoke('generate', {
      body: {
        presetKey: preset.key,
        modelKey: testModel.key,
        prompt: 'A beautiful sunset over the ocean',
        input: {
          params: {
            duration: 5,
            aspect_ratio: '16:9',
          },
        },
      },
    });

    if (error) {
      console.error('❌ Generation error:', error);
      console.error('   Message:', error.message);
      console.error('   Details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Generation started successfully!');
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (e: any) {
    console.error('❌ Exception:', e.message);
    console.error('   Stack:', e.stack);
  }
}

testVideoGeneration().catch(console.error);
