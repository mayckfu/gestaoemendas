CREATE TABLE IF NOT EXISTS public.pre_lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_sequencial serial,
  identificador text,
  ano integer DEFAULT 2025,
  data_referencia date DEFAULT CURRENT_DATE,
  numero_emenda text,
  modalidade_aplicacao text CHECK (modalidade_aplicacao IN ('DIRETA', 'INDIRETA')),
  parlamentar text,
  beneficiario text,
  localidade text,
  valor_previsto numeric DEFAULT 0,
  objeto text,
  funcao text,
  sub_funcao text,
  categoria_economica text,
  acao_orcamentaria text,
  orgao text,
  unidade_orcamentaria text,
  programa text,
  status_operacao text DEFAULT 'INCLUIR',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.pre_lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pre_lancamentos_select_admin" ON public.pre_lancamentos
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA', 'CONSULTA'));

CREATE POLICY "pre_lancamentos_insert" ON public.pre_lancamentos
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

CREATE POLICY "pre_lancamentos_update" ON public.pre_lancamentos
  FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

CREATE POLICY "pre_lancamentos_delete" ON public.pre_lancamentos
  FOR DELETE TO authenticated
  USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

DROP TRIGGER IF EXISTS update_pre_lancamentos_updated_at ON public.pre_lancamentos;
CREATE TRIGGER update_pre_lancamentos_updated_at
  BEFORE UPDATE ON public.pre_lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
