-- Security Reinforcement Migration

-- 1. Ensure RLS is enabled on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- 2. Storage Security
-- Create a private bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Enable RLS on storage objects
-- NOTE: storage.objects usually has RLS enabled by default. 
-- Attempting to enable it again might cause ownership errors if the migration user is not the owner.
-- We skip the ALTER TABLE command to avoid "must be owner of table objects" error.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts and ensure strictness
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;

-- Create strict policies for the 'documents' bucket

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to view files (via signed URL only since bucket is private, but SELECT permission is needed)
-- We restrict this to the 'documents' bucket.
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Allow Admins/Gestors to update/delete files
CREATE POLICY "Admins and Gestors can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND (public.get_user_role() IN ('ADMIN', 'GESTOR')));

CREATE POLICY "Admins and Gestors can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND (public.get_user_role() IN ('ADMIN', 'GESTOR')));

-- 3. Refine Table Policies (Ensure no gaps)

-- Ensure 'profiles' is readable by authenticated users (needed for UI to show names)
DROP POLICY IF EXISTS "Read access for all authenticated users" ON public.profiles;
CREATE POLICY "Read access for all authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Ensure 'cargos' is readable
DROP POLICY IF EXISTS "Read access for all authenticated users" ON public.cargos;
CREATE POLICY "Read access for all authenticated users"
ON public.cargos FOR SELECT
TO authenticated
USING (true);

-- 4. Audit Log Protection
-- Ensure audit logs cannot be deleted or updated even by admins (immutable logs)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.get_user_role() = 'ADMIN');

-- Only system (triggers) or specific functions should insert. 
-- If we rely on triggers, we might not need an INSERT policy for users, 
-- but the trigger runs with the user's privileges.
-- We allow INSERT for authenticated users because the trigger executes as the user.
-- Wait, triggers execute with the privileges of the function owner if SECURITY DEFINER is used.
-- The audit_trigger_func IS SECURITY DEFINER.
-- So we don't necessarily need to grant INSERT on audit_logs to authenticated users directly 
-- if all inserts happen via the trigger function.
-- However, if the app manually inserts logs (like in AdminPage for user creation), we need a policy.
CREATE POLICY "Admins can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role() = 'ADMIN');
