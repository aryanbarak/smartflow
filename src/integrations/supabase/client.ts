import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { resolveSupabaseClientConfig } from './supabaseConfig';

const supabaseConfig = resolveSupabaseClientConfig(import.meta.env);

if (import.meta.env.DEV) {
  console.info(`[Supabase] mode=${supabaseConfig.mode} url=${supabaseConfig.url}`);
}

export const supabase = createClient<Database>(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
