-- ============================================================
--  Migration 001 — Fix profiles table & add SECURITY DEFINER RPC
--  Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Add columns missing from original schema
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS id_number  TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 2. Create a SECURITY DEFINER RPC for profile creation.
--    This bypasses RLS, which is needed because Supabase requires
--    email confirmation by default, so there is NO active session
--    immediately after signUp — auth.uid() would be NULL and the
--    direct INSERT would be rejected by the "Users can manage own
--    profile" policy.
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_id                UUID,
  p_username          TEXT,
  p_full_name         TEXT,
  p_blood_type        TEXT    DEFAULT NULL,
  p_id_type           TEXT    DEFAULT NULL,
  p_id_number         TEXT    DEFAULT NULL,
  p_birth_date        TEXT    DEFAULT NULL,
  p_city              TEXT    DEFAULT NULL,
  p_address           TEXT    DEFAULT NULL,
  p_profile_image_url TEXT    DEFAULT NULL,
  p_front_doc_url     TEXT    DEFAULT NULL,
  p_back_doc_url      TEXT    DEFAULT NULL,
  p_user_type         TEXT    DEFAULT 'donor'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    blood_type,
    id_type,
    id_number,
    birth_date,
    city,
    address,
    profile_image_url,
    front_doc_url,
    back_doc_url,
    user_type
  ) VALUES (
    p_id,
    p_username,
    p_full_name,
    p_blood_type,
    p_id_type,
    p_id_number,
    CASE WHEN p_birth_date IS NOT NULL AND p_birth_date != ''
         THEN p_birth_date::DATE
         ELSE NULL
    END,
    p_city,
    p_address,
    p_profile_image_url,
    p_front_doc_url,
    p_back_doc_url,
    p_user_type
  );
END;
$$;

-- Grant execute to the anon and authenticated roles so the
-- client-side Supabase SDK can call it.
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon, authenticated;
