-- Drop existing restrictive policies
DROP POLICY IF EXISTS "pre_lancamentos_insert" ON public.pre_lancamentos;
DROP POLICY IF EXISTS "pre_lancamentos_update" ON public.pre_lancamentos;
DROP POLICY IF EXISTS "pre_lancamentos_delete" ON public.pre_lancamentos;

-- Recreate policies to allow all roles including CONSULTA
CREATE POLICY "pre_lancamentos_insert" ON public.pre_lancamentos
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA', 'CONSULTA'));

CREATE POLICY "pre_lancamentos_update" ON public.pre_lancamentos
  FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA', 'CONSULTA'));

CREATE POLICY "pre_lancamentos_delete" ON public.pre_lancamentos
  FOR DELETE TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA', 'CONSULTA'));
