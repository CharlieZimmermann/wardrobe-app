-- User profiles table for style preferences and sizing
-- Run this in Supabase SQL Editor: Dashboard -> SQL Editor -> New query

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  style_preference TEXT CHECK (style_preference IN ('casual', 'streetwear', 'business casual', 'smart casual')),
  gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer not to say')),
  body_type TEXT,
  size_top TEXT,
  size_bottom TEXT,
  size_shoes TEXT,
  budget_range TEXT CHECK (budget_range IN ('$', '$$', '$$$', '$$$$')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only read/update their own profile
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
