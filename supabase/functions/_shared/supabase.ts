// Supabase client helpers for Edge Functions
import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  // Try multiple possible env var names for service role key
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');

  if (!supabaseUrl) {
    throw new Error('Missing env: SUPABASE_URL');
  }
  if (!supabaseServiceKey) {
    throw new Error('Missing secret: SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY');
  }

  console.log(`[ServiceClient] Creating with URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`[ServiceClient] Service key found, length: ${supabaseServiceKey.length}`);

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  });
}

export function createPublicClient(authToken?: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  if (authToken) {
    client.auth.setSession({
      access_token: authToken,
      refresh_token: '',
    } as any);
  }

  return client;
}
