CREATE TABLE IF NOT EXISTS public.sismob_sync_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_proposta text,
  source_url text NOT NULL,
  collected_at timestamptz NOT NULL,
  snapshot jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sismob_sync_snapshots_proposta_idx
  ON public.sismob_sync_snapshots (numero_proposta, collected_at DESC);

ALTER TABLE public.sismob_sync_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sismob_sync_snapshots'
      AND policyname = 'Admins can read SISMOB snapshots'
  ) THEN
    CREATE POLICY "Admins can read SISMOB snapshots"
      ON public.sismob_sync_snapshots FOR SELECT
      TO authenticated
      USING (public.get_user_role() = 'ADMIN');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sismob_sync_snapshots'
      AND policyname = 'Admins can create SISMOB snapshots'
  ) THEN
    CREATE POLICY "Admins can create SISMOB snapshots"
      ON public.sismob_sync_snapshots FOR INSERT
      TO authenticated
      WITH CHECK (public.get_user_role() = 'ADMIN' AND created_by = auth.uid());
  END IF;
END $$;

COMMENT ON TABLE public.sismob_sync_snapshots IS
  'Snapshots read-only collected from an authorized, ephemeral SISMOB browser session.';
