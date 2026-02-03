#!/usr/bin/env node
/**
 * Quick check: verify models in database have proper metadata
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.smoke') });
config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

async function main() {
  const { data: models, error } = await supabase
    .from('models')
    .select('key, title, modality, capabilities')
    .eq('provider', 'kie')
    .order('modality')
    .order('title');

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`✅ Total KIE models: ${models?.length || 0}`);
  console.log('\n📊 Models by modality:');

  const byModality: Record<string, number> = {};
  (models || []).forEach(m => {
    byModality[m.modality] = (byModality[m.modality] || 0) + 1;
  });

  Object.entries(byModality).forEach(([modality, count]) => {
    console.log(`  ${modality}: ${count}`);
  });

  const withIdentifier = (models || []).filter(m => {
    const caps = m.capabilities || {};
    return caps.model_identifier && caps.family;
  });

  console.log(`\n✅ Models with model_identifier and family: ${withIdentifier.length}`);
  console.log(`⚠️  Models missing metadata: ${(models?.length || 0) - withIdentifier.length}`);

  if (withIdentifier.length > 0) {
    console.log('\n📋 Sample models with proper metadata:');
    withIdentifier.slice(0, 5).forEach(m => {
      const caps = m.capabilities || {};
      console.log(`  - ${m.key}: ${m.title}`);
      console.log(`    → ${caps.model_identifier} (${caps.family})`);
    });
  }

  const missingMetadata = (models || []).filter(m => {
    const caps = m.capabilities || {};
    return !caps.model_identifier || !caps.family;
  });

  if (missingMetadata.length > 0) {
    console.log('\n⚠️  Models missing metadata:');
    missingMetadata.forEach(m => {
      console.log(`  - ${m.key}: ${m.title}`);
    });
    console.log('\n💡 Run migration 20240101000008_remove_placeholder_models.sql to clean up');
  }
}

main().catch(console.error);
