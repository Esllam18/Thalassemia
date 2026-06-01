-- =============================================================
-- COMPLETE FIX — Run this entire file in Supabase SQL Editor
-- Fixes: infinite recursion, loading issues, permissions
-- =============================================================

-- -------------------------------------------------------
-- FIX 1: Drop the broken "admins read all" policy on profiles
-- This policy queries profiles FROM INSIDE a profiles policy
-- which causes infinite recursion.
-- -------------------------------------------------------
DROP POLICY IF EXISTS "profiles: admins read all" ON public.profiles;

-- -------------------------------------------------------
-- FIX 2: Recreate it safely using auth.jwt() instead
-- auth.jwt() reads the JWT token metadata — no DB query needed
-- -------------------------------------------------------
CREATE POLICY "profiles: admins read all"
  ON public.profiles FOR SELECT
  USING (
    (auth.jwt() ->> 'role') = 'admin'
    OR auth.uid() = id
  );

-- -------------------------------------------------------
-- FIX 3: Drop the broken "doctors read all" policy on predictions
-- Same problem — it queries profiles from inside predictions policy
-- -------------------------------------------------------
DROP POLICY IF EXISTS "predictions: doctors read all" ON public.predictions;

-- Recreate it safely
CREATE POLICY "predictions: doctors read all"
  ON public.predictions FOR SELECT
  USING (
    auth.uid() = user_id
    OR (auth.jwt() ->> 'role') IN ('doctor', 'admin')
  );

-- -------------------------------------------------------
-- FIX 4: Ensure all basic RLS policies exist
-- -------------------------------------------------------

-- profiles: users can read their own row
DROP POLICY IF EXISTS "profiles: users read own" ON public.profiles;
CREATE POLICY "profiles: users read own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- profiles: users can update their own row
DROP POLICY IF EXISTS "profiles: users update own" ON public.profiles;
CREATE POLICY "profiles: users update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- predictions: users can read their own
DROP POLICY IF EXISTS "predictions: users read own" ON public.predictions;
CREATE POLICY "predictions: users read own"
  ON public.predictions FOR SELECT
  USING (auth.uid() = user_id);

-- predictions: users can insert their own
DROP POLICY IF EXISTS "predictions: users insert own" ON public.predictions;
CREATE POLICY "predictions: users insert own"
  ON public.predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- notifications: users can read their own
DROP POLICY IF EXISTS "notifications: users read own" ON public.notifications;
CREATE POLICY "notifications: users read own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- notifications: users can update their own
DROP POLICY IF EXISTS "notifications: users update own" ON public.notifications;
CREATE POLICY "notifications: users update own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- FIX 5: Rebuild user_statistics view with security_invoker
-- -------------------------------------------------------
DROP VIEW IF EXISTS public.user_statistics;

CREATE OR REPLACE VIEW public.user_statistics
WITH (security_invoker = true)
AS
SELECT
  p.id                                                              AS user_id,
  p.email,
  p.full_name,
  p.role,
  COUNT(pr.id)                                                      AS total_predictions,
  MAX(pr.created_at)                                                AS last_prediction_at,
  AVG(pr.confidence)                                                AS avg_confidence,
  AVG(pr.thalassemia_score)                                         AS avg_score,
  COUNT(pr.id) FILTER (WHERE pr.thalassemia_score <= 2)             AS normal_count,
  COUNT(pr.id) FILTER (WHERE pr.thalassemia_score BETWEEN 3 AND 4)  AS borderline_count,
  COUNT(pr.id) FILTER (WHERE pr.thalassemia_score BETWEEN 5 AND 6)  AS possible_count,
  COUNT(pr.id) FILTER (WHERE pr.thalassemia_score >= 7)             AS high_risk_count
FROM public.profiles p
LEFT JOIN public.predictions pr ON pr.user_id = p.id
GROUP BY p.id, p.email, p.full_name, p.role;

-- Allow authenticated users to query this view
GRANT SELECT ON public.user_statistics TO authenticated;

-- -------------------------------------------------------
-- VERIFY — you should see all policies listed, no recursion
-- -------------------------------------------------------
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'predictions', 'notifications')
ORDER BY tablename, policyname;
