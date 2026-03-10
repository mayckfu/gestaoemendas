-- Migration to add Tipo Emenda Enum and Fix Permissions

-- 1. Create the new Enum Type
DO $$ BEGIN
    CREATE TYPE public.tipo_emenda_enum AS ENUM ('individual', 'bancada', 'comissao');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update emendas table to use the new enum
-- We use a CASE statement to map existing text values to the new enum values safely
ALTER TABLE public.emendas 
ALTER COLUMN tipo TYPE public.tipo_emenda_enum 
USING (
  CASE 
    WHEN lower(tipo) LIKE '%individual%' THEN 'individual'::public.tipo_emenda_enum
    WHEN lower(tipo) LIKE '%bancada%' THEN 'bancada'::public.tipo_emenda_enum
    WHEN lower(tipo) LIKE '%comiss_o%' OR lower(tipo) LIKE '%comissao%' THEN 'comissao'::public.tipo_emenda_enum
    ELSE 'individual'::public.tipo_emenda_enum -- Default fallback for safety
  END
);

-- 3. Ensure Profiles RLS allows Admin INSERTs explicitly
-- Although "ALL" should cover it, we add a specific INSERT policy to be sure and avoid ambiguity.
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role() = 'ADMIN');

-- 4. Ensure Audit Logs RLS allows Admin INSERTs explicitly (Reinforcement)
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role() = 'ADMIN');

