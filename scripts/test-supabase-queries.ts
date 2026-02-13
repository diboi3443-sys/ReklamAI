#!/usr/bin/env tsx
/**
 * Test Supabase PostgREST queries to find the correct syntax
 * This script tests different query syntaxes to identify which works
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQueries() {
  console.log('🧪 Testing Supabase PostgREST queries...\n');

  // First, get a test user (or use service role)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ Not authenticated. Please login first.');
    process.exit(1);
  }

  console.log(`✅ Authenticated as: ${user.id}\n`);

  // Test 1: Simple select without relations
  console.log('📋 Test 1: Simple select without relations');
  try {
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('owner_id', user.id)
      .limit(1);
    
    if (error) {
      console.error('  ❌ Error:', error.message);
    } else {
      console.log('  ✅ Success:', data?.length || 0, 'records');
    }
  } catch (e: any) {
    console.error('  ❌ Exception:', e.message);
  }
  console.log('');

  // Test 2: Simple relation syntax (presets(...))
  console.log('📋 Test 2: Simple relation syntax presets(...)');
  try {
    const { data, error } = await supabase
      .from('generations')
      .select(`
        *,
        presets(title_ru, title_en, type)
      `)
      .eq('owner_id', user.id)
      .limit(1);
    
    if (error) {
      console.error('  ❌ Error:', error.message);
      console.error('  Details:', error);
    } else {
      console.log('  ✅ Success:', data?.length || 0, 'records');
      if (data && data.length > 0) {
        console.log('  Sample data:', JSON.stringify(data[0], null, 2).substring(0, 200));
      }
    }
  } catch (e: any) {
    console.error('  ❌ Exception:', e.message);
  }
  console.log('');

  // Test 3: Explicit foreign key syntax with ! (presets!preset_id(...))
  console.log('📋 Test 3: Explicit foreign key syntax presets!preset_id(...)');
  try {
    const { data, error } = await supabase
      .from('generations')
      .select(`
        *,
        presets!preset_id(title_ru, title_en, type)
      `)
      .eq('owner_id', user.id)
      .limit(1);
    
    if (error) {
      console.error('  ❌ Error:', error.message);
      console.error('  Details:', error);
    } else {
      console.log('  ✅ Success:', data?.length || 0, 'records');
    }
  } catch (e: any) {
    console.error('  ❌ Exception:', e.message);
  }
  console.log('');

  // Test 4: Using foreign key constraint name
  console.log('📋 Test 4: Using foreign key constraint name (generations_preset_id_fkey)');
  try {
    const { data, error } = await supabase
      .from('generations')
      .select(`
        *,
        presets!generations_preset_id_fkey(title_ru, title_en, type)
      `)
      .eq('owner_id', user.id)
      .limit(1);
    
    if (error) {
      console.error('  ❌ Error:', error.message);
    } else {
      console.log('  ✅ Success:', data?.length || 0, 'records');
    }
  } catch (e: any) {
    console.error('  ❌ Exception:', e.message);
  }
  console.log('');

  // Test 5: Separate queries (manual join)
  console.log('📋 Test 5: Separate queries (manual join)');
  try {
    const { data: generations, error: genError } = await supabase
      .from('generations')
      .select('*')
      .eq('owner_id', user.id)
      .limit(1);
    
    if (genError) {
      console.error('  ❌ Generations error:', genError.message);
    } else if (generations && generations.length > 0) {
      const gen = generations[0];
      const { data: preset, error: presetError } = await supabase
        .from('presets')
        .select('title_ru, title_en, type')
        .eq('id', gen.preset_id)
        .single();
      
      if (presetError) {
        console.error('  ❌ Preset error:', presetError.message);
      } else {
        console.log('  ✅ Success: Manual join works');
        console.log('  Preset:', preset);
      }
    }
  } catch (e: any) {
    console.error('  ❌ Exception:', e.message);
  }
  console.log('');

  // Test 6: Check foreign key constraints in database
  console.log('📋 Test 6: Check foreign key constraints');
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'generations'
          AND kcu.column_name IN ('preset_id', 'model_id');
      `
    });
    
    if (error) {
      console.error('  ❌ Error:', error.message);
      console.log('  ℹ️  Note: RPC function may not exist, trying direct query...');
    } else {
      console.log('  ✅ Foreign keys:', JSON.stringify(data, null, 2));
    }
  } catch (e: any) {
    console.log('  ℹ️  RPC not available, skipping...');
  }
  console.log('');

  // Test 7: Full query with all relations (current syntax)
  console.log('📋 Test 7: Full query with all relations (current syntax)');
  try {
    const { data, error } = await supabase
      .from('generations')
      .select(`
        *,
        presets(title_ru, title_en, type),
        models(title, provider),
        assets(kind, storage_path, storage_bucket)
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('  ❌ Error:', error.message);
      console.error('  Code:', error.code);
      console.error('  Details:', error.details);
      console.error('  Hint:', error.hint);
    } else {
      console.log('  ✅ Success:', data?.length || 0, 'records');
      if (data && data.length > 0) {
        console.log('  Sample:', JSON.stringify(data[0], null, 2).substring(0, 300));
      }
    }
  } catch (e: any) {
    console.error('  ❌ Exception:', e.message);
  }
  console.log('');

  console.log('✅ Testing complete!');
}

testQueries().catch(console.error);
