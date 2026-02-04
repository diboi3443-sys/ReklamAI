// Supabase client for frontend
import { createClient } from '@supabase/supabase-js';

// Support both Vite env vars and window.APP_CONFIG (for reg.ru hosting)
const getEnvVar = (key: string): string => {
  // First try Vite env vars (for Vercel, ISPmanager with env vars)
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }
  // Fallback to window.APP_CONFIG (for reg.ru without env vars)
  if (typeof window !== 'undefined' && (window as any).APP_CONFIG) {
    return (window as any).APP_CONFIG[key] || '';
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || '';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || '';

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
