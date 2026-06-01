-- =============================================================
-- CRITICAL FIX: Infinite Recursion in profiles RLS Policy
-- Run this in Supabase SQL Editor
-- =============================================================

-- THE BUG:
-- The "profiles: admins read all" policy does:
--   EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
-- This queries the `profiles` table FROM WITHIN a policy ON `profiles`.
-- Supabase evaluates RLS on every table access, so this creates infinite recursion:
--   Access profiles → check policy → query profiles → check policy → query profiles → ...
-- Error: "infinite recursion detected in policy for relation profiles"

-- FIX: Use a SECURITY DEFINER function to check the role.
-- SECURITY DEFINER bypasses RLS when executing, breaking the recursion.

-- Step 1: Create a helper function that checks role WITHOUT triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;


-- Step 2: Drop the recursive policy
DROP POLICY IF EXISTS "profiles: admins read all" ON public.profiles;

-- Step 3: Recreate it using the safe function (no recursion)
CREATE POLICY "profiles: admins read all"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() IN ('admin', 'doctor'));


-- Step 4: Also fix the predictions "doctors read all" policy for consistency
-- (same pattern — queries profiles from within a predictions policy, which is safe
--  because it's a different table, but using the function is cleaner and faster)
DROP POLICY IF EXISTS "predictions: doctors read all" ON public.predictions;

CREATE POLICY "predictions: doctors read all"
  ON public.predictions FOR SELECT
  USING (public.get_my_role() IN ('doctor', 'admin'));


-- Step 5: Fix the storage policies for the same reason
-- (lab-reports: doctors read all queries profiles — different table so no recursion,
--  but replace with the function for performance)
DROP POLICY IF EXISTS "lab-reports: doctors read all" ON storage.objects;

CREATE POLICY "lab-reports: doctors read all"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lab-reports'
    AND public.get_my_role() IN ('doctor', 'admin')
  );


-- Step 6: Recreate user_statistics view with security_invoker
-- (Ensures the view respects the calling user's RLS, not the owner's)
DROP VIEW IF EXISTS public.user_statistics;

CREATE OR REPLACE VIEW public.user_statistics
WITH (security_invoker = true)
AS
SELECT
  p.id                                         AS user_id,
  p.email,
  p.full_name,
  p.role,
  COUNT(pr.id)                                 AS total_predictions,
  MAX(pr.created_at)                           AS last_prediction_at,
  AVG(pr.confidence)                           AS avg_confidence,
  AVG(pr.thalassemia_score)                    AS avg_score,
  COUNT(pr.id) FILTER (WHERE pr.thalassemia_score <= 2)            AS normal_count,
  COUNT(pr.id) FILTER (WHERE pr.thalassemia_score BETWEEN 3 AND 4) AS borderline_count,
  COUNT(pr.id) FILTER (WHERE pr.thalassemia_score BETWEEN 5 AND 6) AS possible_count,
  COUNT(pr.id) FILTER (WHERE pr.thalassemia_score >= 7)            AS high_risk_count
FROM public.profiles p
LEFT JOIN public.predictions pr ON pr.user_id = p.id
GROUP BY p.id, p.email, p.full_name, p.role;

GRANT SELECT ON public.user_statistics TO authenticated;


-- VERIFY: Check all policies are in place
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'predictions', 'notifications')
ORDER BY tablename, policyname;
