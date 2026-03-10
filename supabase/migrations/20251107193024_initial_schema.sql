-- ASPLAN Database Schema
-- Based on User Story for Parliamentary Amendment Control

-- Enable UUID extension (pgcrypto is preferred for gen_random_uuid in older PG, but native in 13+)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- CLEANUP (For re-run safety)
-- =============================================
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.pendencias CASCADE;
DROP TABLE IF EXISTS public.historico CASCADE;
DROP TABLE IF EXISTS public.anexos CASCADE;
DROP TABLE IF EXISTS public.despesas CASCADE;
DROP TABLE IF EXISTS public.repasses CASCADE;
DROP TABLE IF EXISTS public.emendas CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.cargos CASCADE;

DROP TYPE IF EXISTS public.status_interno CASCADE;
DROP TYPE IF EXISTS public.situacao_oficial CASCADE;
DROP TYPE IF EXISTS public.tipo_recurso CASCADE;
DROP TYPE IF EXISTS public.user_status CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE public.user_role AS ENUM ('ADMIN', 'GESTOR', 'ANALISTA', 'CONSULTA');
CREATE TYPE public.user_status AS ENUM ('ATIVO', 'BLOQUEADO', 'PENDENTE');
CREATE TYPE public.tipo_recurso AS ENUM ('CUSTEIO_MAC', 'CUSTEIO_PAP', 'EQUIPAMENTO', 'INCREMENTO_MAC', 'INCREMENTO_PAP', 'OUTRO');
CREATE TYPE public.situacao_oficial AS ENUM ('PAGA', 'EMPENHADA_AGUARDANDO_FORMALIZACAO', 'FAVORAVEL', 'EM_ANALISE', 'LIBERADO_PAGAMENTO_FNS', 'OUTRA');
CREATE TYPE public.status_interno AS ENUM ('RASCUNHO', 'EM_EXECUCAO', 'PAGA_SEM_DOCUMENTOS', 'PAGA_COM_PENDENCIAS', 'CONCLUIDA', 'PROPOSTA_PAGA', 'EM_ANALISE_PAGAMENTO', 'APROVADA_PAGAMENTO', 'AUTORIZADA_AGUARDANDO_EMPENHO', 'AGUARDANDO_AUTORIZACAO_FNS', 'PORTARIA_PUBLICADA_AGUARDANDO_FNS', 'ENVIADA_PUBLICACAO_PORTARIA', 'PROPOSTA_APROVADA', 'CLASSIFICADA_AGUARDANDO_SECRETARIA');

-- =============================================
-- TABLES
-- =============================================

-- CARGOS TABLE
CREATE TABLE public.cargos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    descricao text,
    default_role public.user_role,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.cargos IS 'Job roles for users.';

-- PROFILES TABLE (Extends auth.users)
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    name text NOT NULL,
    email text NOT NULL,
    cpf text,
    cargo_id uuid REFERENCES public.cargos(id) ON DELETE SET NULL,
    unidade text,
    role public.user_role NOT NULL DEFAULT 'CONSULTA',
    status public.user_status NOT NULL DEFAULT 'PENDENTE',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'Extended user profile information.';

-- EMENDAS TABLE
CREATE TABLE public.emendas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_emenda text NOT NULL,
    numero_proposta text,
    autor text NOT NULL,
    parlamentar text NOT NULL,
    tipo text NOT NULL, -- Individual, Bancada, etc.
    tipo_recurso public.tipo_recurso NOT NULL,
    valor_total numeric(15, 2) NOT NULL DEFAULT 0,
    situacao public.situacao_oficial NOT NULL DEFAULT 'EM_ANALISE',
    status_interno public.status_interno NOT NULL DEFAULT 'RASCUNHO',
    portaria text,
    deliberacao_cie text,
    anexos_essenciais boolean DEFAULT false,
    descricao_completa text,
    natureza text,
    objeto_emenda text,
    meta_operacional text,
    destino_recurso text,
    data_repasse date,
    valor_repasse numeric(15, 2),
    situacao_recurso text,
    observacoes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.emendas IS 'Main table for parliamentary amendments.';

-- REPASSES TABLE
CREATE TABLE public.repasses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    emenda_id uuid REFERENCES public.emendas(id) ON DELETE CASCADE,
    data date NOT NULL,
    valor numeric(15, 2) NOT NULL,
    fonte text NOT NULL,
    status text NOT NULL DEFAULT 'PENDENTE', -- REPASSADO, PENDENTE, CANCELADO
    observacoes text,
    created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.repasses IS 'Financial transfers related to amendments.';

-- DESPESAS TABLE
CREATE TABLE public.despesas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    emenda_id uuid REFERENCES public.emendas(id) ON DELETE CASCADE,
    data date NOT NULL,
    valor numeric(15, 2) NOT NULL,
    categoria text,
    descricao text NOT NULL,
    fornecedor_nome text,
    nota_fiscal_url text,
    registrada_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    autorizada_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    responsavel_execucao uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    unidade_destino text,
    status_execucao text NOT NULL DEFAULT 'PLANEJADA', -- PLANEJADA, EMPENHADA, LIQUIDADA, PAGA
    demanda text,
    created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.despesas IS 'Expenses incurred against amendments.';

-- ANEXOS TABLE
CREATE TABLE public.anexos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    emenda_id uuid REFERENCES public.emendas(id) ON DELETE CASCADE,
    titulo text NOT NULL,
    url text NOT NULL,
    tipo text NOT NULL, -- PORTARIA, DELIBERACAO_CIE, etc.
    uploader uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    data_documento date,
    created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.anexos IS 'Documents and attachments.';

-- HISTORICO TABLE
CREATE TABLE public.historico (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    emenda_id uuid REFERENCES public.emendas(id) ON DELETE CASCADE,
    evento text NOT NULL,
    detalhe text,
    feito_por uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    criado_em timestamptz DEFAULT now()
);
COMMENT ON TABLE public.historico IS 'History log for amendments.';

-- PENDENCIAS TABLE
CREATE TABLE public.pendencias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    emenda_id uuid REFERENCES public.emendas(id) ON DELETE CASCADE,
    descricao text NOT NULL,
    dispensada boolean DEFAULT false,
    resolvida boolean DEFAULT false,
    justificativa text,
    target_type text,
    target_id text,
    created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.pendencias IS 'Tracked issues or requirements for amendments.';

-- AUDIT LOGS TABLE (System-wide)
CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    record_id uuid,
    action text NOT NULL, -- INSERT, UPDATE, DELETE
    old_data jsonb,
    new_data jsonb,
    changed_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    changed_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.audit_logs IS 'System-wide audit trail for all critical actions.';

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.get_user_role() = 'ADMIN');
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Emendas Policies
CREATE POLICY "Read access for all authenticated users" ON public.emendas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Write access for ADMIN, GESTOR, ANALISTA" ON public.emendas FOR ALL USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

-- Repasses Policies
CREATE POLICY "Read access for all authenticated users" ON public.repasses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Write access for ADMIN, GESTOR" ON public.repasses FOR ALL USING (public.get_user_role() IN ('ADMIN', 'GESTOR'));

-- Despesas Policies
CREATE POLICY "Read access for all authenticated users" ON public.despesas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Write access for ADMIN, GESTOR, ANALISTA" ON public.despesas FOR ALL USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

-- Anexos Policies
CREATE POLICY "Read access for all authenticated users" ON public.anexos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Write access for ADMIN, GESTOR, ANALISTA" ON public.anexos FOR ALL USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

-- Audit Logs Policies
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.get_user_role() = 'ADMIN');

-- =============================================
-- TRIGGERS
-- =============================================

-- Audit Trigger Function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    user_id uuid := auth.uid();
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), user_id);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), user_id);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), user_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Audit Triggers
CREATE TRIGGER audit_emendas AFTER INSERT OR UPDATE OR DELETE ON public.emendas FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_repasses AFTER INSERT OR UPDATE OR DELETE ON public.repasses FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_despesas AFTER INSERT OR UPDATE OR DELETE ON public.despesas FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_anexos AFTER INSERT OR UPDATE OR DELETE ON public.anexos FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
