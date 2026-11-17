ALTER TABLE public.fns_sync_history
  ADD COLUMN IF NOT EXISTS request_year integer,
  ADD COLUMN IF NOT EXISTS batch_id uuid;

CREATE INDEX IF NOT EXISTS fns_sync_history_batch_idx
  ON public.fns_sync_history (batch_id, synced_at DESC)
  WHERE batch_id IS NOT NULL;

COMMENT ON COLUMN public.fns_sync_history.request_year IS
  'Exercise year selected by the user for a bulk synchronization.';

COMMENT ON COLUMN public.fns_sync_history.batch_id IS
  'Client-generated identifier grouping preview or apply records from the same bulk run.';
