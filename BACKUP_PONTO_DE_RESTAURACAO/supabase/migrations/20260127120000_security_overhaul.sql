-- Security Overhaul Migration
-- Implements strict RBAC, profile protection, and refined permissions.

-- 1. Revoke Broad Grants (Least Privilege)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

-- 2. Grant Usage and Basic Access
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- 3. Grant Write Permissions for Specific Tables (Restricted by RLS)
GRANT INSERT, UPDATE, DELETE ON public.emendas TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.repasses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.despesas TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.anexos TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pendencias TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.historico TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT INSERT, UPDATE ON public.security_notifications TO authenticated;

-- Profiles: Update is allowed but restricted by RLS
GRANT UPDATE ON public.profiles TO authenticated;

-- Audit Logs: Insert only
GRANT INSERT ON public.audit_logs TO authenticated;

-- 4. RLS Policy Refactoring

-- --- PROFILES ---
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;

-- Select: Everyone can see profiles (needed for UI to show names)
CREATE POLICY "Profiles select policy" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Update: Admin can update any profile
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE TO authenticated 
USING (public.get_user_role() = 'ADMIN');

-- Update: Users can update own profile, BUT cannot change role or status
CREATE POLICY "Self update profiles" ON public.profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND (
    public.get_user_role() = 'ADMIN' OR (
      role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
      status = (SELECT status FROM public.profiles WHERE id = auth.uid())
    )
  )
);

-- --- EMENDAS ---
DROP POLICY IF EXISTS "Read access for all authenticated users" ON public.emendas;
DROP POLICY IF EXISTS "Write access for ADMIN, GESTOR, ANALISTA" ON public.emendas;
DROP POLICY IF EXISTS "Authenticated users can select emendas" ON public.emendas;
DROP POLICY IF EXISTS "Authenticated users can insert emendas" ON public.emendas;
DROP POLICY IF EXISTS "Authenticated users can update emendas" ON public.emendas;

CREATE POLICY "Emendas SELECT" ON public.emendas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Emendas INSERT" ON public.emendas FOR INSERT TO authenticated 
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

CREATE POLICY "Emendas UPDATE" ON public.emendas FOR UPDATE TO authenticated 
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

CREATE POLICY "Emendas DELETE" ON public.emendas FOR DELETE TO authenticated 
USING (public.get_user_role() IN ('ADMIN', 'GESTOR'));

-- --- REPASSES ---
DROP POLICY IF EXISTS "Read access for all authenticated users" ON public.repasses;
DROP POLICY IF EXISTS "Write access for ADMIN, GESTOR" ON public.repasses;
DROP POLICY IF EXISTS "Authenticated users can select repasses" ON public.repasses;
DROP POLICY IF EXISTS "Authenticated users can insert repasses" ON public.repasses;
DROP POLICY IF EXISTS "Authenticated users can update repasses" ON public.repasses;

CREATE POLICY "Repasses SELECT" ON public.repasses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Repasses INSERT" ON public.repasses FOR INSERT TO authenticated 
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR'));

CREATE POLICY "Repasses UPDATE" ON public.repasses FOR UPDATE TO authenticated 
USING (public.get_user_role() IN ('ADMIN', 'GESTOR'));

CREATE POLICY "Repasses DELETE" ON public.repasses FOR DELETE TO authenticated 
USING (public.get_user_role() IN ('ADMIN', 'GESTOR'));

-- --- DESPESAS ---
DROP POLICY IF EXISTS "Read access for all authenticated users" ON public.despesas;
DROP POLICY IF EXISTS "Write access for ADMIN, GESTOR, ANALISTA" ON public.despesas;
DROP POLICY IF EXISTS "Authenticated users can select despesas" ON public.despesas;
DROP POLICY IF EXISTS "Authenticated users can insert despesas" ON public.despesas;
DROP POLICY IF EXISTS "Authenticated users can update despesas" ON public.despesas;

CREATE POLICY "Despesas SELECT" ON public.despesas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Despesas INSERT" ON public.despesas FOR INSERT TO authenticated 
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

CREATE POLICY "Despesas UPDATE" ON public.despesas FOR UPDATE TO authenticated 
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

CREATE POLICY "Despesas DELETE" ON public.despesas FOR DELETE TO authenticated 
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

-- --- ANEXOS ---
DROP POLICY IF EXISTS "Read access for all authenticated users" ON public.anexos;
DROP POLICY IF EXISTS "Write access for ADMIN, GESTOR, ANALISTA" ON public.anexos;
DROP POLICY IF EXISTS "Authenticated users can select anexos" ON public.anexos;
DROP POLICY IF EXISTS "Authenticated users can insert anexos" ON public.anexos;
DROP POLICY IF EXISTS "Authenticated users can update anexos" ON public.anexos;

CREATE POLICY "Anexos SELECT" ON public.anexos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anexos INSERT" ON public.anexos FOR INSERT TO authenticated 
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

CREATE POLICY "Anexos UPDATE" ON public.anexos FOR UPDATE TO authenticated 
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

CREATE POLICY "Anexos DELETE" ON public.anexos FOR DELETE TO authenticated 
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

-- --- PENDENCIAS ---
DROP POLICY IF EXISTS "Authenticated users can select pendencias" ON public.pendencias;
DROP POLICY IF EXISTS "Authenticated users can insert pendencias" ON public.pendencias;
DROP POLICY IF EXISTS "Authenticated users can update pendencias" ON public.pendencias;

CREATE POLICY "Pendencias SELECT" ON public.pendencias FOR SELECT TO authenticated USING (true);

CREATE POLICY "Pendencias INSERT" ON public.pendencias FOR INSERT TO authenticated 
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

CREATE POLICY "Pendencias UPDATE" ON public.pendencias FOR UPDATE TO authenticated 
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

CREATE POLICY "Pendencias DELETE" ON public.pendencias FOR DELETE TO authenticated 
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

-- --- HISTORICO ---
DROP POLICY IF EXISTS "Authenticated users can select historico" ON public.historico;

CREATE POLICY "Historico SELECT" ON public.historico FOR SELECT TO authenticated USING (true);

CREATE POLICY "Historico INSERT" ON public.historico FOR INSERT TO authenticated 
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

-- --- AUDIT LOGS ---
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

CREATE POLICY "Admins view audit" ON public.audit_logs FOR SELECT TO authenticated 
USING (public.get_user_role() = 'ADMIN');

CREATE POLICY "System insert audit" ON public.audit_logs FOR INSERT TO authenticated 
WITH CHECK (true);

-- No UPDATE/DELETE policies for audit_logs ensure immutability


