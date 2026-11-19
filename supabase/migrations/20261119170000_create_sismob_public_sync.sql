CREATE TABLE IF NOT EXISTS public.sismob_public_works (
  proposal_id bigint PRIMARY KEY,
  numero_proposta text NOT NULL,
  municipio text,
  uf text,
  tipo_obra text,
  tipo_recurso text,
  programa text,
  valor_proposta numeric,
  situacao_obra text,
  etapa_proposta text,
  percentual_executado numeric,
  numero_portaria text,
  data_portaria date,
  endereco jsonb NOT NULL DEFAULT '{}'::jsonb,
  parcelas jsonb NOT NULL DEFAULT '[]'::jsonb,
  fotografias jsonb NOT NULL DEFAULT '[]'::jsonb,
  empresas jsonb NOT NULL DEFAULT '[]'::jsonb,
  dados_publicos jsonb NOT NULL,
  fonte_url text NOT NULL,
  source_updated_at timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sismob_public_sync_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING','COMPLETED','PARTIAL','FAILED')),
  total integer NOT NULL DEFAULT 0,
  success integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS sismob_public_works_numero_idx ON public.sismob_public_works(numero_proposta);
ALTER TABLE public.sismob_public_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sismob_public_sync_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sismob_public_works' AND policyname='Authenticated users read SISMOB public works') THEN
    CREATE POLICY "Authenticated users read SISMOB public works" ON public.sismob_public_works FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sismob_public_sync_history' AND policyname='Admins read SISMOB public history') THEN
    CREATE POLICY "Admins read SISMOB public history" ON public.sismob_public_sync_history FOR SELECT TO authenticated USING (public.get_user_role()='ADMIN');
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.sismob_public_works;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sismob_public_sync_history;
