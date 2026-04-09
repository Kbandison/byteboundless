-- Fix infinite recursion: admin policies on profiles read from profiles
-- Solution: use a security definer function that bypasses RLS

-- Create a helper function that checks admin without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop the recursive policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all jobs" ON public.scrape_jobs;
DROP POLICY IF EXISTS "Admins can read all businesses" ON public.businesses;

-- Recreate using the function (no recursion since SECURITY DEFINER bypasses RLS)
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can read all jobs"
  ON public.scrape_jobs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can read all businesses"
  ON public.businesses FOR SELECT
  USING (public.is_admin());
