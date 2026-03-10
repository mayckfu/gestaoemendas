CREATE TABLE IF NOT EXISTS public.limites_exercicio (
  ano INTEGER PRIMARY KEY,
  limite_mac NUMERIC NOT NULL DEFAULT 0,
  limite_pap NUMERIC NOT NULL DEFAULT 0,
  limite_capital NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.limites_exercicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Limites select policy" ON public.limites_exercicio
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Limites insert policy" ON public.limites_exercicio
  FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'ADMIN');

CREATE POLICY "Limites update policy" ON public.limites_exercicio
  FOR UPDATE TO authenticated USING (public.get_user_role() = 'ADMIN');

CREATE TRIGGER update_limites_exercicio_updated_at
  BEFORE UPDATE ON public.limites_exercicio
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
