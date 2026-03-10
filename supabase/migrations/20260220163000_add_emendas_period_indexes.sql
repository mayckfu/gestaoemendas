-- Add indexes to public.emendas to optimize period filtering queries
CREATE INDEX IF NOT EXISTS idx_emendas_ano_exercicio ON public.emendas(ano_exercicio);
CREATE INDEX IF NOT EXISTS idx_emendas_created_at ON public.emendas(created_at);
