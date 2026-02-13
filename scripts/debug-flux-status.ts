#!/usr/bin/env node
/**
 * Debug Flux Kontext status endpoint
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log('🔍 Debugging Flux Kontext Status Endpoint\n');
  
  // Auth
  const { data: auth } = await supabase.auth.signInWithPassword({
    email: 'flux-test@example.com',
    password: 'fluxTest123!',
  });
  
  if (!auth?.session) {
    console.log('Auth failed');
    return;
  }
  
  // Get latest flux generation
  const { data: gens } = await supabase
    .from('generations')
    .select('id, provider_task_id, model_id, status')
    .eq('owner_id', auth.user!.id)
    .not('provider_task_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (!gens || gens.length === 0) {
    console.log('No generations with task ID found');
    return;
  }
  
  const gen = gens[0];
  console.log('Generation:', gen.id);
  console.log('Task ID:', gen.provider_task_id);
  console.log('Current status:', gen.status);
  console.log('');
  
  // Check Supabase logs via status endpoint with verbose logging
  console.log('Calling status endpoint to check logs...');
  const EDGE_BASE = process.env.VITE_SUPABASE_URL + '/functions/v1';
  
  const res = await fetch(`${EDGE_BASE}/status?generationId=${gen.id}`, {
    headers: { 'Authorization': `Bearer ${auth.session.access_token}` }
  });
  
  console.log('HTTP Status:', res.status);
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  
  console.log('');
  console.log('='.repeat(50));
  console.log('Check Supabase Dashboard logs for detailed KIE API calls:');
  console.log('https://supabase.com/dashboard/project/wgblrrhstqxwfiltkwcc/logs/edge-logs');
  console.log('');
  console.log('Look for lines with "[STATUS]" and "[KIE]" to see:');
  console.log('  - API Family being used');
  console.log('  - Status endpoint URL');
  console.log('  - KIE API response');
}

main();
