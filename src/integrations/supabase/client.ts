import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Anon key is a public credential — safe to commit (RLS enforces data access).
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://taqxwnlwllbywaklwyno.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcXh3bmx3bGxieXdha2x3eW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODQzNjEsImV4cCI6MjA5MzQ2MDM2MX0.TmhuyWcwEUwnSvxXJiZ2HueY6Jr0sudmyJWlpM-X7_Y';

export const supabase = createClient<Database>(SUPABASE_URL, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
