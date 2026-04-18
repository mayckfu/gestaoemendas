-- Migration to create actions and destinations structure

-- Create acoes_emendas table
CREATE TABLE IF NOT EXISTS public.acoes_emendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emenda_id UUID NOT NULL REFERENCES public.emendas(id) ON DELETE CASCADE,
    nome_acao TEXT NOT NULL,
    area TEXT NOT NULL,
    complexidade TEXT,
    publico_alvo TEXT,
    descricao_oficial TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create destinacoes_recursos table
CREATE TABLE IF NOT EXISTS public.destinacoes_recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acao_id UUID NOT NULL REFERENCES public.acoes_emendas(id) ON DELETE CASCADE,
    tipo_destinacao TEXT NOT NULL,
    subtipo TEXT,
    valor_destinado NUMERIC(15, 2) NOT NULL DEFAULT 0,
    portaria_vinculada TEXT,
    observacao_tecnica TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Update despesas table
ALTER TABLE public.despesas 
ADD COLUMN IF NOT EXISTS destinacao_id UUID REFERENCES public.destinacoes_recursos(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.acoes_emendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinacoes_recursos ENABLE ROW LEVEL SECURITY;

-- Policies for acoes_emendas
CREATE POLICY "Acoes Select" ON public.acoes_emendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Acoes Insert" ON public.acoes_emendas FOR INSERT TO authenticated 
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));
CREATE POLICY "Acoes Update" ON public.acoes_emendas FOR UPDATE TO authenticated 
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));
CREATE POLICY "Acoes Delete" ON public.acoes_emendas FOR DELETE TO authenticated 
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

-- Policies for destinacoes_recursos
CREATE POLICY "Destinacoes Select" ON public.destinacoes_recursos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Destinacoes Insert" ON public.destinacoes_recursos FOR INSERT TO authenticated 
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));
CREATE POLICY "Destinacoes Update" ON public.destinacoes_recursos FOR UPDATE TO authenticated 
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));
CREATE POLICY "Destinacoes Delete" ON public.destinacoes_recursos FOR DELETE TO authenticated 
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acoes_emendas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.destinacoes_recursos TO authenticated;
