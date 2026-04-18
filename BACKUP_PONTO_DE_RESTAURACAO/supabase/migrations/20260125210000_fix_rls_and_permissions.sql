-- Fix RLS Policies for Dashboard and General Access
-- This migration ensures that authenticated users can access the necessary data
-- to prevent 403 Forbidden errors on the Dashboard and Quadro Estadual.

-- Enable RLS on all relevant tables (idempotent)
ALTER TABLE public.emendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. EMENDAS Policies
DROP POLICY IF EXISTS "Authenticated users can select emendas" ON public.emendas;
CREATE POLICY "Authenticated users can select emendas" 
ON public.emendas FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert emendas" ON public.emendas;
CREATE POLICY "Authenticated users can insert emendas" 
ON public.emendas FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update emendas" ON public.emendas;
CREATE POLICY "Authenticated users can update emendas" 
ON public.emendas FOR UPDATE 
TO authenticated 
USING (true);

-- 2. REPASSES Policies
DROP POLICY IF EXISTS "Authenticated users can select repasses" ON public.repasses;
CREATE POLICY "Authenticated users can select repasses" 
ON public.repasses FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert repasses" ON public.repasses;
CREATE POLICY "Authenticated users can insert repasses" 
ON public.repasses FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update repasses" ON public.repasses;
CREATE POLICY "Authenticated users can update repasses" 
ON public.repasses FOR UPDATE 
TO authenticated 
USING (true);

-- 3. DESPESAS Policies
DROP POLICY IF EXISTS "Authenticated users can select despesas" ON public.despesas;
CREATE POLICY "Authenticated users can select despesas" 
ON public.despesas FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert despesas" ON public.despesas;
CREATE POLICY "Authenticated users can insert despesas" 
ON public.despesas FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update despesas" ON public.despesas;
CREATE POLICY "Authenticated users can update despesas" 
ON public.despesas FOR UPDATE 
TO authenticated 
USING (true);

-- 4. PENDENCIAS Policies
DROP POLICY IF EXISTS "Authenticated users can select pendencias" ON public.pendencias;
CREATE POLICY "Authenticated users can select pendencias" 
ON public.pendencias FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert pendencias" ON public.pendencias;
CREATE POLICY "Authenticated users can insert pendencias" 
ON public.pendencias FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update pendencias" ON public.pendencias;
CREATE POLICY "Authenticated users can update pendencias" 
ON public.pendencias FOR UPDATE 
TO authenticated 
USING (true);

-- 5. ANEXOS Policies
DROP POLICY IF EXISTS "Authenticated users can select anexos" ON public.anexos;
CREATE POLICY "Authenticated users can select anexos" 
ON public.anexos FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert anexos" ON public.anexos;
CREATE POLICY "Authenticated users can insert anexos" 
ON public.anexos FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update anexos" ON public.anexos;
CREATE POLICY "Authenticated users can update anexos" 
ON public.anexos FOR UPDATE 
TO authenticated 
USING (true);

-- 6. PROFILES Policies
DROP POLICY IF EXISTS "Authenticated users can select profiles" ON public.profiles;
CREATE POLICY "Authenticated users can select profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;
CREATE POLICY "Authenticated users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Ensure public access to necessary enums/types is not restricted by RLS (Types are not tables, but good to check context)
-- Grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
