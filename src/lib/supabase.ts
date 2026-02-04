// Supabase client for frontend
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.';
  console.error(errorMsg);
  console.error('Current values:', {
    VITE_SUPABASE_URL: supabaseUrl ? '✓ Set' : '✗ Missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '✓ Set' : '✗ Missing',
  });
  
  // Don't throw error, but log it - app should still render
  if (typeof window !== 'undefined') {
    console.error('App will continue but Supabase features will not work.');
  }
}

// Create client with fallback empty strings to prevent crashes
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Helper to get auth token for Edge Functions
export async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}
