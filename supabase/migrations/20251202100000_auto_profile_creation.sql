-- Migration: Auto Profile Creation, Backfill, and RLS for User Management

-- 1. Create function to handle new user creation automatically
-- This function will be triggered whenever a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role public.user_role := 'CONSULTA';
  default_status public.user_status := 'PENDENTE';
  user_name text;
BEGIN
  -- Try to get name from metadata, default to 'Novo Usuário' or email prefix
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, email, name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    default_role,
    default_status
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill missing profiles for existing users
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT id, email, raw_user_meta_data 
    FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    INSERT INTO public.profiles (id, email, name, role, status)
    VALUES (
      r.id,
      r.email,
      COALESCE(r.raw_user_meta_data->>'name', split_part(r.email, '@', 1)),
      'CONSULTA',
      'PENDENTE'
    );
  END LOOP;
END $$;

-- 4. Update RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate for specific requirements
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Admin Policy: Full Access
CREATE POLICY "Admins can do everything on profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'ADMIN')
  WITH CHECK (public.get_user_role() = 'ADMIN');

-- User Policy: View All (Required for app functionality like Dashboard listing responsible persons)
-- This satisfies "SELECT access to their own profile row" by including it in "all"
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- User Policy: Update Own (Restricted fields via Trigger below)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Trigger to prevent non-admins from updating sensitive fields (role, status)
CREATE OR REPLACE FUNCTION public.prevent_profile_sensitive_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow Service Role (superuser) or Admin to bypass
  -- Note: get_user_role() uses auth.uid(). If using service_role key, auth.uid() is usually null.
  -- If auth.uid() is null, we assume it's a system process/edge function and allow it.
  IF auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'ADMIN' THEN
    -- Check if role or status is being changed
    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'You are not authorized to update role or status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_profile_updates ON public.profiles;
CREATE TRIGGER check_profile_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_sensitive_updates();

