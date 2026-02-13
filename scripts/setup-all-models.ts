#!/usr/bin/env node
/**
 * Setup and test all KIE models according to documentation
 * 
 * Special APIs (have their own endpoints):
 * - Veo3 API: /api/v1/veo/generate
 * - Runway API: /api/v1/runway/generate
 * - Luma API: /api/v1/luma/generate
 * - Suno API: /api/v1/suno/generate
 * - 4o Image API: /api/v1/4o-image/generate
 * - Flux Kontext API: /api/v1/flux/kontext/generate
 * 
 * Market API (use /api/v1/jobs/createTask):
 * - Kling, Hailuo, Sora2, Wan, Topaz, Infinitalk
 * - Flux-2, Ideogram, Qwen, Recraft, Google Imagen
 * - Elevenlabs
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Model configurations by API family
const MODEL_UPDATES = [
  // === VEO3 API ===
  { key: 'veo3', family: 'veo3', requires_callback: true },
  { key: 'veo3_fast', family: 'veo3', requires_callback: true },
  
  // === RUNWAY API ===
  { key: 'gen3a_turbo', family: 'runway', requires_callback: true },
  { key: 'gen4_turbo', family: 'runway', requires_callback: true },
  
  // === LUMA API ===
  { key: 'luma-dream-machine', family: 'luma', requires_callback: true },
  { key: 'luma-ray-2', family: 'luma', requires_callback: true },
  
  // === SUNO API ===
  { key: 'chirp-v4', family: 'suno', requires_callback: true },
  { key: 'chirp-v3-5', family: 'suno', requires_callback: true },
  
  // === 4O IMAGE API ===
  { key: 'gpt-image-1', family: '4o-image', requires_callback: true },
  { key: 'gpt-image/1.5-text-to-image', family: '4o-image', requires_callback: true },
  { key: 'gpt-image/1.5-image-to-image', family: '4o-image', requires_callback: true },
  { key: 'gpt-image-1.5-text-to-image', family: '4o-image', requires_callback: true },
  
  // === FLUX KONTEXT API ===
  { key: 'flux-kontext-pro', family: 'flux-kontext', requires_callback: true },
  { key: 'flux-kontext-max', family: 'flux-kontext', requires_callback: true },
  
  // === MARKET API (no callback needed, uses polling) ===
  // Kling
  { key: 'kling/text-to-video', family: 'market' },
  { key: 'kling/image-to-video', family: 'market' },
  { key: 'kling/v2-1-master-text-to-video', family: 'market' },
  { key: 'kling/v2-1-master-image-to-video', family: 'market' },
  { key: 'kling/v2-1-pro', family: 'market' },
  { key: 'kling/v2-1-standard', family: 'market' },
  { key: 'kling/motion-control', family: 'market' },
  
  // Hailuo
  { key: 'hailuo/02-text-to-video-pro', family: 'market' },
  { key: 'hailuo/02-text-to-video-standard', family: 'market' },
  { key: 'hailuo/02-image-to-video-pro', family: 'market' },
  { key: 'hailuo/2-3-image-to-video-pro', family: 'market' },
  
  // Sora2
  { key: 'sora2/sora-2-text-to-video', family: 'market' },
  { key: 'sora2/sora-2-image-to-video', family: 'market' },
  { key: 'sora2/sora-2-pro-text-to-video', family: 'market' },
  { key: 'sora2/sora-2-characters', family: 'market' },
  
  // Wan
  { key: 'wan/2-6-text-to-video', family: 'market' },
  { key: 'wan/2-6-image-to-video', family: 'market' },
  { key: 'wan/2-2-a14b-text-to-video-turbo', family: 'market' },
  { key: 'wan/2-2-a14b-image-to-video-turbo', family: 'market' },
  
  // ByteDance
  { key: 'bytedance/v1-pro-text-to-video', family: 'market' },
  { key: 'bytedance/v1-lite-text-to-video', family: 'market' },
  { key: 'bytedance/seedance-1.5-pro', family: 'market' },
  
  // Flux-2 (Market API)
  { key: 'flux-2/pro-text-to-image', family: 'market' },
  { key: 'flux-2/pro-image-to-image', family: 'market' },
  { key: 'flux-2/flex-text-to-image', family: 'market' },
  
  // Google Imagen
  { key: 'google/imagen4', family: 'market' },
  { key: 'google/imagen4-fast', family: 'market' },
  { key: 'google/imagen4-ultra', family: 'market' },
  { key: 'google/nano-banana', family: 'market' },
  
  // Grok
  { key: 'grok-imagine/text-to-image', family: 'market' },
  { key: 'grok-imagine/text-to-video', family: 'market' },
  { key: 'grok-imagine/image-to-image', family: 'market' },
  
  // Ideogram
  { key: 'ideogram/character', family: 'market' },
  { key: 'ideogram/character-edit', family: 'market' },
  { key: 'ideogram/v3-reframe', family: 'market' },
  
  // Qwen
  { key: 'qwen-vl-max', family: 'market' },
  
  // Recraft
  { key: 'recraft/crisp-upscale', family: 'market' },
  { key: 'recraft/remove-background', family: 'market' },
  
  // Topaz
  { key: 'topaz/image-upscale', family: 'market' },
  { key: 'topaz/video-upscale', family: 'market' },
  
  // Seedream (Midjourney-like)
  { key: 'seedream-v4-text-to-image', family: 'market' },
  { key: 'seedream-4.5-text-to-image', family: 'market' },
  { key: 'z-image', family: 'market' },
  
  // ElevenLabs
  { key: 'elevenlabs/sound-effect-v2', family: 'market' },
  { key: 'elevenlabs/text-to-speech-multilingual-v2', family: 'market' },
  { key: 'elevenlabs/audio-isolation', family: 'market' },
  
  // Infinitalk
  { key: 'infinitalk/from-audio', family: 'market' },
];

async function updateModels() {
  console.log('🔧 Updating model configurations...\n');
  
  let updated = 0;
  let notFound = 0;
  
  for (const config of MODEL_UPDATES) {
    // First check if model exists
    const { data: existing } = await supabase
      .from('models')
      .select('id, key, capabilities')
      .eq('key', config.key)
      .single();
    
    if (!existing) {
      // Try alternative key formats
      const altKey = config.key.replace(/\//g, '-');
      const { data: altExisting } = await supabase
        .from('models')
        .select('id, key, capabilities')
        .eq('key', altKey)
        .single();
      
      if (!altExisting) {
        console.log(`⚠️  Not found: ${config.key}`);
        notFound++;
        continue;
      }
    }
    
    const model = existing || (await supabase
      .from('models')
      .select('id, key, capabilities')
      .eq('key', config.key.replace(/\//g, '-'))
      .single()).data;
    
    if (!model) {
      notFound++;
      continue;
    }
    
    // Update capabilities
    const newCapabilities = {
      ...model.capabilities,
      family: config.family,
      requires_callback: config.requires_callback || false,
    };
    
    const { error } = await supabase
      .from('models')
      .update({ capabilities: newCapabilities })
      .eq('id', model.id);
    
    if (error) {
      console.log(`❌ Error updating ${config.key}: ${error.message}`);
    } else {
      console.log(`✅ ${config.key} → family: ${config.family}${config.requires_callback ? ' (callback)' : ''}`);
      updated++;
    }
  }
  
  console.log(`\n📊 Updated: ${updated}, Not found: ${notFound}`);
}

async function listModelsByFamily() {
  console.log('\n📋 Models by API family:\n');
  
  const { data: models } = await supabase
    .from('models')
    .select('key, modality, capabilities')
    .eq('provider', 'kie')
    .order('modality');
  
  const byFamily: Record<string, string[]> = {};
  
  for (const m of models || []) {
    const family = m.capabilities?.family || 'market';
    if (!byFamily[family]) byFamily[family] = [];
    byFamily[family].push(`${m.key} (${m.modality})`);
  }
  
  for (const [family, keys] of Object.entries(byFamily).sort()) {
    console.log(`\n${family.toUpperCase()} API (${keys.length} models):`);
    for (const k of keys.slice(0, 10)) {
      console.log(`  - ${k}`);
    }
    if (keys.length > 10) {
      console.log(`  ... and ${keys.length - 10} more`);
    }
  }
}

async function main() {
  console.log('🚀 Setting up all KIE models\n');
  console.log('='.repeat(60));
  
  await updateModels();
  await listModelsByFamily();
  
  console.log('\n✅ Setup complete!');
}

main().catch(console.error);
