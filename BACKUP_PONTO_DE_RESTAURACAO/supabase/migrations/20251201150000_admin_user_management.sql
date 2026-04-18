-- Reinforce RLS policies for Admin User Management

-- Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Allow Admins to UPDATE profiles (User Editing, blocking)
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.get_user_role() = 'ADMIN');

-- 2. Allow Admins to DELETE profiles (User Deletion)
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.get_user_role() = 'ADMIN');

-- 3. Ensure users can view all profiles (needed for listing in Admin Panel and references)
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 4. Note on INSERT:
-- We purposefully do NOT allow INSERT via RLS for Admins directly if we want to enforce
-- using the 'create-user' Edge Function, which ensures Auth + Profile are created together.
-- However, for flexibility and avoiding breakage if client-side code attempts it (and to support legacy logic),
-- we can allow it. But the primary method is now the Edge Function.
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role() = 'ADMIN');

-- 5. Ensure Users can update their own profile (optional, but good practice)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
