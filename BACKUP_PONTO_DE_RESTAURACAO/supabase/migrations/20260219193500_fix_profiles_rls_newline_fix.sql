-- Fix the profiles RLS policy that contains newlines, breaking types generation
DO $$
DECLARE
  pol record;
BEGIN
  -- Drop all UPDATE policies on profiles to clear out the one with newlines
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'UPDATE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END
$$;

-- Create simpler policies without subqueries that Postgres formats with newlines
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE
  USING (public.get_user_role()::text = 'ADMIN')
  WITH CHECK (public.get_user_role()::text = 'ADMIN');

-- Use a trigger to enforce role and status protection for non-admins
CREATE OR REPLACE FUNCTION public.protect_profile_role_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is an admin, allow them to change anything
  IF public.get_user_role()::text = 'ADMIN' THEN
    RETURN NEW;
  END IF;

  -- Otherwise, enforce that role and status cannot be changed by the user
  NEW.role = OLD.role;
  NEW.status = OLD.status;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_profile_role_status ON public.profiles;
CREATE TRIGGER protect_profile_role_status
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role_status();

