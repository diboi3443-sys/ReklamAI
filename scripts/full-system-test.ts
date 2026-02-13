#!/usr/bin/env npx tsx
/**
 * Full System Test - Tests all components of ReklamAI
 * Run: npx tsx scripts/full-system-test.ts
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wgblrrhstqxwfiltkwcc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function log(message: string) {
  console.log(`[TEST] ${message}`);
}

function addResult(name: string, status: 'passed' | 'failed' | 'warning', message: string, details?: any) {
  results.push({ name, status, message, details });
  const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);
  if (details) {
    console.log(`   Details:`, JSON.stringify(details, null, 2));
  }
}

async function testSupabaseConnection() {
  log('Testing Supabase connection...');
  
  if (!SUPABASE_URL) {
    addResult('Supabase URL', 'failed', 'VITE_SUPABASE_URL not set');
    return false;
  }
  
  if (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_KEY) {
    addResult('Supabase Key', 'failed', 'No Supabase key set (VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY)');
    return false;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);
  
  try {
    const { data, error } = await supabase.from('models').select('count').limit(1);
    if (error) throw error;
    addResult('Supabase Connection', 'passed', 'Connected successfully');
    return true;
  } catch (error: any) {
    addResult('Supabase Connection', 'failed', error.message);
    return false;
  }
}

async function testModelsTable() {
  log('Testing models table...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);
  
  try {
    const { data: models, error } = await supabase
      .from('models')
      .select('id, key, modality, provider, capabilities')
      .eq('provider', 'kie');
    
    if (error) throw error;
    
    if (!models || models.length === 0) {
      addResult('Models Table', 'failed', 'No KIE models found in database');
      return;
    }
    
    addResult('Models Count', 'passed', `Found ${models.length} KIE models`);
    
    // Check for models without model_identifier
    const missingIdentifier = models.filter(m => !m.capabilities?.model_identifier);
    if (missingIdentifier.length > 0) {
      addResult('Model Identifiers', 'warning', 
        `${missingIdentifier.length} models missing model_identifier`, 
        missingIdentifier.map(m => m.key)
      );
    } else {
      addResult('Model Identifiers', 'passed', 'All models have model_identifier');
    }
    
    // Check video models
    const videoModels = models.filter(m => m.modality === 'video');
    addResult('Video Models', 'passed', `Found ${videoModels.length} video models`);
    
    // Check video models have correct family
    const videoWithFamily = videoModels.filter(m => m.capabilities?.family);
    if (videoWithFamily.length < videoModels.length) {
      const missingFamily = videoModels.filter(m => !m.capabilities?.family);
      addResult('Video Model Families', 'warning', 
        `${missingFamily.length} video models missing family`,
        missingFamily.map(m => ({ key: m.key, capabilities: m.capabilities }))
      );
    } else {
      addResult('Video Model Families', 'passed', 'All video models have family configured');
    }
    
    // Check special API models have requires_callback
    const specialModels = videoModels.filter(m => 
      ['veo3', 'runway', 'luma'].includes(m.capabilities?.family)
    );
    const missingCallback = specialModels.filter(m => !m.capabilities?.requires_callback);
    if (missingCallback.length > 0) {
      addResult('Callback Config', 'warning',
        `${missingCallback.length} special API models missing requires_callback`,
        missingCallback.map(m => m.key)
      );
    } else if (specialModels.length > 0) {
      addResult('Callback Config', 'passed', 'All special API models have requires_callback');
    }
    
  } catch (error: any) {
    addResult('Models Table', 'failed', error.message);
  }
}

async function testPresetsTable() {
  log('Testing presets table...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);
  
  try {
    const { data: presets, error } = await supabase
      .from('presets')
      .select('id, key, type, title_ru, title_en');
    
    if (error) throw error;
    
    if (!presets || presets.length === 0) {
      addResult('Presets Table', 'warning', 'No presets found');
      return;
    }
    
    addResult('Presets Count', 'passed', `Found ${presets.length} presets`);
    
    // Check presets by type
    const imagePresets = presets.filter(p => p.type === 'image');
    const videoPresets = presets.filter(p => p.type === 'video');
    
    addResult('Image Presets', 'passed', `${imagePresets.length} image presets`);
    addResult('Video Presets', 'passed', `${videoPresets.length} video presets`);
    
  } catch (error: any) {
    addResult('Presets Table', 'failed', error.message);
  }
}

async function testEdgeFunctionsEndpoint() {
  log('Testing Edge Functions endpoint...');
  
  const functionsUrl = `${SUPABASE_URL}/functions/v1`;
  
  // Test generate endpoint (should return 401 without auth)
  try {
    const response = await fetch(`${functionsUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    
    if (response.status === 401) {
      addResult('Generate Endpoint', 'passed', 'Endpoint exists (returns 401 without auth)');
    } else if (response.status === 500) {
      const data = await response.json().catch(() => ({}));
      if (data.error?.includes('KIE_API_KEY')) {
        addResult('Generate Endpoint', 'warning', 'Missing KIE_API_KEY secret');
      } else {
        addResult('Generate Endpoint', 'warning', `Unexpected 500 error: ${data.error || 'Unknown'}`);
      }
    } else {
      addResult('Generate Endpoint', 'warning', `Unexpected status: ${response.status}`);
    }
  } catch (error: any) {
    addResult('Generate Endpoint', 'failed', `Network error: ${error.message}`);
  }
  
  // Test status endpoint (should return 401 without auth)
  try {
    const response = await fetch(`${functionsUrl}/status?generationId=test`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.status === 401) {
      addResult('Status Endpoint', 'passed', 'Endpoint exists (returns 401 without auth)');
    } else {
      addResult('Status Endpoint', 'warning', `Unexpected status: ${response.status}`);
    }
  } catch (error: any) {
    addResult('Status Endpoint', 'failed', `Network error: ${error.message}`);
  }
}

async function testRLSPolicies() {
  log('Testing RLS policies...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SUPABASE_SERVICE_KEY);
  
  // Test public read on models (should work without auth)
  try {
    const { data, error } = await supabase
      .from('models')
      .select('id, key')
      .limit(1);
    
    if (error) {
      addResult('Models RLS', 'failed', `Cannot read models: ${error.message}`);
    } else {
      addResult('Models RLS', 'passed', 'Public read on models works');
    }
  } catch (error: any) {
    addResult('Models RLS', 'failed', error.message);
  }
  
  // Test public read on presets (should work without auth)
  try {
    const { data, error } = await supabase
      .from('presets')
      .select('id, key')
      .limit(1);
    
    if (error) {
      addResult('Presets RLS', 'failed', `Cannot read presets: ${error.message}`);
    } else {
      addResult('Presets RLS', 'passed', 'Public read on presets works');
    }
  } catch (error: any) {
    addResult('Presets RLS', 'failed', error.message);
  }
}

async function testDatabaseQueries() {
  log('Testing database queries (like frontend uses)...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SUPABASE_SERVICE_KEY);
  
  // Test models query
  try {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .order('modality', { ascending: true })
      .order('provider', { ascending: true });
    
    if (error) throw error;
    addResult('Models Query', 'passed', `Query returned ${data?.length || 0} models`);
  } catch (error: any) {
    addResult('Models Query', 'failed', error.message);
  }
  
  // Test presets query
  try {
    const { data, error } = await supabase
      .from('presets')
      .select('id, key, type, title_ru, title_en');
    
    if (error) throw error;
    addResult('Presets Query', 'passed', `Query returned ${data?.length || 0} presets`);
  } catch (error: any) {
    addResult('Presets Query', 'failed', error.message);
  }
}

async function runAllTests() {
  console.log('\n========================================');
  console.log('🔍 ReklamAI Full System Test');
  console.log('========================================\n');
  
  await testSupabaseConnection();
  await testModelsTable();
  await testPresetsTable();
  await testEdgeFunctionsEndpoint();
  await testRLSPolicies();
  await testDatabaseQueries();
  
  // Summary
  console.log('\n========================================');
  console.log('📊 Test Summary');
  console.log('========================================');
  
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️ Warnings: ${warnings}`);
  console.log(`📋 Total: ${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
  }
  
  if (warnings > 0) {
    console.log('\n⚠️ WARNINGS:');
    results.filter(r => r.status === 'warning').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`);
    });
  }
  
  console.log('\n========================================');
  
  // Exit with error if any test failed
  if (failed > 0) {
    console.log('❌ Some tests failed. Please fix issues before deploy.');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️ Tests passed with warnings. Consider fixing before deploy.');
    process.exit(0);
  } else {
    console.log('✅ All tests passed! Ready for deploy.');
    process.exit(0);
  }
}

runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
