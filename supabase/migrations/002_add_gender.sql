-- Add gender column to user_profiles
-- Run in Supabase SQL Editor if you already ran 001_user_profiles.sql

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer not to say'));
