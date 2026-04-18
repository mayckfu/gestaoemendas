-- Fix RLS Policies for missing tables

-- CARGOS
-- Read access for all authenticated users
CREATE POLICY "Read access for all authenticated users" 
ON public.cargos FOR SELECT 
USING (auth.role() = 'authenticated');

-- Write access for ADMIN
CREATE POLICY "Write access for ADMIN" 
ON public.cargos FOR ALL 
USING (public.get_user_role() = 'ADMIN');


-- PENDENCIAS
-- Read access for all authenticated users
CREATE POLICY "Read access for all authenticated users" 
ON public.pendencias FOR SELECT 
USING (auth.role() = 'authenticated');

-- Write access for ADMIN, GESTOR, ANALISTA
CREATE POLICY "Write access for ADMIN, GESTOR, ANALISTA" 
ON public.pendencias FOR ALL 
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));


-- HISTORICO
-- Read access for all authenticated users
CREATE POLICY "Read access for all authenticated users" 
ON public.historico FOR SELECT 
USING (auth.role() = 'authenticated');

-- Write access for ADMIN, GESTOR, ANALISTA (if needed by app logic, otherwise triggers handle it)
CREATE POLICY "Write access for ADMIN, GESTOR, ANALISTA" 
ON public.historico FOR ALL 
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));
