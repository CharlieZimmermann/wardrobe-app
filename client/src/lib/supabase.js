/**
 * Supabase client for the frontend
 *
 * Add these to your .env file (with VITE_ prefix - Vite only exposes env vars that start with VITE_):
 *   VITE_SUPABASE_URL=your-project-url
 *   VITE_SUPABASE_ANON_KEY=your-anon-key
 *
 * Get these from your Supabase project dashboard.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only create the client if we have valid credentials
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
