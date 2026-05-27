import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Anon key is a public credential — safe to commit (RLS enforces data access).
const FALLBACK_URL = 'https://taqxwnlwllbywaklwyno.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcXh3bmx3bGxieXdha2x3eW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODQzNjEsImV4cCI6MjA5MzQ2MDM2MX0.TmhuyWcwEUwnSvxXJiZ2HueY6Jr0sudmyJWlpM-X7_Y';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
// Guard against truncated/wrong env values — fall back to the known-good hardcoded URL.
const SUPABASE_URL = rawUrl.includes('supabase.co') ? rawUrl : FALLBACK_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

if (rawUrl !== SUPABASE_URL) {
  console.error('[supabase] VITE_SUPABASE_URL looks wrong, fell back to hardcoded value. Got:', rawUrl);
}

export const supabase = createClient<Database>(SUPABASE_URL, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
