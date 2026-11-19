CREATE TABLE IF NOT EXISTS public.sismob_workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  machine_key text NOT NULL UNIQUE,
  priority smallint NOT NULL CHECK (priority BETWEEN 1 AND 99),
  enabled boolean NOT NULL DEFAULT true,
  secret_hash text NOT NULL,
  status text NOT NULL DEFAULT 'OFFLINE' CHECK (status IN ('OFFLINE','ONLINE','BUSY','ERROR')),
  last_seen_at timestamptz,
  current_job_id uuid,
  version text,
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sismob_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CLAIMED','RUNNING','COMPLETED','FAILED','CANCELLED')),
  mode text NOT NULL DEFAULT 'AUTHENTICATED_FULL' CHECK (mode IN ('PUBLIC','AUTHENTICATED_FULL')),
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  claimed_by uuid REFERENCES public.sismob_workers(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  lease_until timestamptz,
  heartbeat_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  current_item text,
  total_items integer,
  processed_items integer NOT NULL DEFAULT 0,
  success_items integer NOT NULL DEFAULT 0,
  failed_items integer NOT NULL DEFAULT 0,
  result_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text
);

ALTER TABLE public.sismob_workers
  DROP CONSTRAINT IF EXISTS sismob_workers_current_job_id_fkey;
ALTER TABLE public.sismob_workers
  ADD CONSTRAINT sismob_workers_current_job_id_fkey
  FOREIGN KEY (current_job_id) REFERENCES public.sismob_sync_jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sismob_workers_presence_idx ON public.sismob_workers (enabled, priority, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS sismob_sync_jobs_queue_idx ON public.sismob_sync_jobs (status, requested_at);
CREATE UNIQUE INDEX IF NOT EXISTS sismob_sync_snapshots_unique_collection_idx ON public.sismob_sync_snapshots (numero_proposta, collected_at);

ALTER TABLE public.sismob_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sismob_sync_jobs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sismob_workers' AND policyname='Admins read SISMOB workers') THEN
    CREATE POLICY "Admins read SISMOB workers" ON public.sismob_workers FOR SELECT TO authenticated USING (public.get_user_role() = 'ADMIN');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sismob_workers' AND policyname='Admins manage SISMOB workers') THEN
    CREATE POLICY "Admins manage SISMOB workers" ON public.sismob_workers FOR ALL TO authenticated USING (public.get_user_role() = 'ADMIN') WITH CHECK (public.get_user_role() = 'ADMIN');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sismob_sync_jobs' AND policyname='Admins read SISMOB jobs') THEN
    CREATE POLICY "Admins read SISMOB jobs" ON public.sismob_sync_jobs FOR SELECT TO authenticated USING (public.get_user_role() = 'ADMIN');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sismob_sync_jobs' AND policyname='Admins create SISMOB jobs') THEN
    CREATE POLICY "Admins create SISMOB jobs" ON public.sismob_sync_jobs FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'ADMIN' AND requested_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sismob_sync_jobs' AND policyname='Admins cancel SISMOB jobs') THEN
    CREATE POLICY "Admins cancel SISMOB jobs" ON public.sismob_sync_jobs FOR UPDATE TO authenticated USING (public.get_user_role() = 'ADMIN') WITH CHECK (public.get_user_role() = 'ADMIN');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.claim_next_sismob_job(p_worker_id uuid)
RETURNS SETOF public.sismob_sync_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_worker public.sismob_workers; v_job public.sismob_sync_jobs;
BEGIN
  SELECT * INTO v_worker FROM public.sismob_workers WHERE id=p_worker_id AND enabled FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  IF EXISTS (
    SELECT 1 FROM public.sismob_workers w
    WHERE w.enabled AND w.priority < v_worker.priority
      AND w.last_seen_at > now() - interval '90 seconds'
      AND w.status IN ('ONLINE','BUSY')
  ) THEN RETURN; END IF;

  SELECT * INTO v_job FROM public.sismob_sync_jobs
  WHERE status='PENDING' OR (status IN ('CLAIMED','RUNNING') AND lease_until < now())
  ORDER BY requested_at FOR UPDATE SKIP LOCKED LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;

  UPDATE public.sismob_sync_jobs SET status='CLAIMED', claimed_by=p_worker_id, claimed_at=now(),
    lease_until=now()+interval '2 minutes', heartbeat_at=now(), error=NULL WHERE id=v_job.id RETURNING * INTO v_job;
  UPDATE public.sismob_workers SET status='BUSY', current_job_id=v_job.id, updated_at=now() WHERE id=p_worker_id;
  RETURN NEXT v_job;
END $$;

REVOKE ALL ON FUNCTION public.claim_next_sismob_job(uuid) FROM PUBLIC, anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.sismob_workers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sismob_sync_jobs;
