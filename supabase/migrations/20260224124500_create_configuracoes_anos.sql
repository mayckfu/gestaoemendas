CREATE TABLE IF NOT EXISTS public.configuracoes_anos (
  ano INTEGER PRIMARY KEY,
  liberado_geral BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.configuracoes_anos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anos SELECT" ON public.configuracoes_anos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anos INSERT" ON public.configuracoes_anos
  FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "Anos UPDATE" ON public.configuracoes_anos
  FOR UPDATE TO authenticated USING (public.get_user_role() = 'ADMIN');

CREATE POLICY "Anos DELETE" ON public.configuracoes_anos
  FOR DELETE TO authenticated USING (public.get_user_role() = 'ADMIN');

DROP TRIGGER IF EXISTS update_configuracoes_anos_updated_at ON public.configuracoes_anos;
CREATE TRIGGER update_configuracoes_anos_updated_at
  BEFORE UPDATE ON public.configuracoes_anos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.configuracoes_anos (ano, liberado_geral) VALUES
  (2024, true),
  (2025, true),
  (2026, false)
ON CONFLICT (ano) DO UPDATE SET liberado_geral = EXCLUDED.liberado_geral;
