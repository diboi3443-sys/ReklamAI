#!/usr/bin/env node
/**
 * Check Flux models and recent generations
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('🔍 Checking Flux models and recent generations\n');
  
  // Check all models
  console.log('📋 All KIE models in database:');
  console.log('-'.repeat(60));
  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select('key, title, modality, provider, capabilities')
    .eq('provider', 'kie')
    .order('modality');
  
  if (modelsError) {
    console.error('Error loading models:', modelsError);
  } else {
    models?.forEach(m => {
      const modelId = m.capabilities?.model_identifier || m.key;
      const isFlux = m.key.toLowerCase().includes('flux') || m.title?.toLowerCase().includes('flux');
      console.log(`${isFlux ? '⚡' : '  '} ${m.key} → ${modelId} (${m.modality})`);
    });
  }
  
  // Check for Flux specifically
  console.log('\n📋 Flux models specifically:');
  console.log('-'.repeat(60));
  const { data: fluxModels } = await supabase
    .from('models')
    .select('*')
    .ilike('key', '%flux%');
  
  if (!fluxModels || fluxModels.length === 0) {
    console.log('❌ No Flux models found in database!');
    console.log('   You may need to add Flux models to the models table.');
  } else {
    fluxModels.forEach(m => {
      console.log(`✅ ${m.key}`);
      console.log(`   Title: ${m.title}`);
      console.log(`   Modality: ${m.modality}`);
      console.log(`   Model Identifier: ${m.capabilities?.model_identifier || 'NOT SET'}`);
      console.log(`   Family: ${m.capabilities?.family || 'market'}`);
      console.log('');
    });
  }
  
  // Check recent generations
  console.log('\n📋 Last 5 generations:');
  console.log('-'.repeat(60));
  const { data: generations, error: genError } = await supabase
    .from('generations')
    .select('id, status, prompt, model_id, created_at, error')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (genError) {
    console.error('Error loading generations:', genError);
  } else {
    for (const gen of generations || []) {
      // Get model info
      let modelKey = 'unknown';
      if (gen.model_id) {
        const { data: model } = await supabase
          .from('models')
          .select('key')
          .eq('id', gen.model_id)
          .single();
        modelKey = model?.key || gen.model_id;
      }
      
      const statusIcon = gen.status === 'succeeded' ? '✅' : gen.status === 'failed' ? '❌' : '⏳';
      console.log(`${statusIcon} ${gen.id.substring(0, 8)}... | ${gen.status} | ${modelKey}`);
      console.log(`   Prompt: ${(gen.prompt || '').substring(0, 50)}...`);
      if (gen.error) {
        console.log(`   ❌ Error: ${JSON.stringify(gen.error).substring(0, 100)}`);
      }
      console.log(`   Created: ${gen.created_at}`);
      console.log('');
    }
  }
  
  // Check failed generations
  console.log('\n📋 Recent failed generations:');
  console.log('-'.repeat(60));
  const { data: failedGens } = await supabase
    .from('generations')
    .select('id, status, prompt, model_id, error, created_at')
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (!failedGens || failedGens.length === 0) {
    console.log('✅ No recent failed generations');
  } else {
    for (const gen of failedGens) {
      let modelKey = 'unknown';
      if (gen.model_id) {
        const { data: model } = await supabase
          .from('models')
          .select('key')
          .eq('id', gen.model_id)
          .single();
        modelKey = model?.key || gen.model_id;
      }
      
      console.log(`❌ ${gen.id}`);
      console.log(`   Model: ${modelKey}`);
      console.log(`   Prompt: ${(gen.prompt || '').substring(0, 50)}...`);
      console.log(`   Error: ${JSON.stringify(gen.error)}`);
      console.log('');
    }
  }
  
  // Check queued/processing
  console.log('\n📋 Currently processing generations:');
  console.log('-'.repeat(60));
  const { data: activeGens } = await supabase
    .from('generations')
    .select('id, status, prompt, model_id, provider_task_id, created_at')
    .in('status', ['queued', 'processing'])
    .order('created_at', { ascending: false });
  
  if (!activeGens || activeGens.length === 0) {
    console.log('ℹ️ No generations currently in progress');
  } else {
    for (const gen of activeGens) {
      let modelKey = 'unknown';
      if (gen.model_id) {
        const { data: model } = await supabase
          .from('models')
          .select('key')
          .eq('id', gen.model_id)
          .single();
        modelKey = model?.key || gen.model_id;
      }
      
      console.log(`⏳ ${gen.id}`);
      console.log(`   Status: ${gen.status}`);
      console.log(`   Model: ${modelKey}`);
      console.log(`   Provider Task: ${gen.provider_task_id || 'NOT YET'}`);
      console.log(`   Created: ${gen.created_at}`);
      console.log('');
    }
  }
}

main().catch(console.error);
