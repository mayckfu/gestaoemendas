CREATE TABLE IF NOT EXISTS public.fns_sync_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    emenda_id uuid NOT NULL REFERENCES public.emendas(id) ON DELETE CASCADE,
    numero_proposta text NOT NULL,
    status text NOT NULL CHECK (status IN ('PREVIEW', 'APPLIED', 'NOT_FOUND', 'ERROR')),
    official_data jsonb,
    stages_data jsonb,
    applied_changes jsonb NOT NULL DEFAULT '{}'::jsonb,
    conflicts jsonb NOT NULL DEFAULT '{}'::jsonb,
    error_message text,
    synced_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fns_sync_history_emenda_synced_idx
    ON public.fns_sync_history (emenda_id, synced_at DESC);

CREATE INDEX IF NOT EXISTS fns_sync_history_proposta_synced_idx
    ON public.fns_sync_history (numero_proposta, synced_at DESC);

ALTER TABLE public.fns_sync_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read FNS sync history"
    ON public.fns_sync_history;

CREATE POLICY "Authenticated users can read FNS sync history"
    ON public.fns_sync_history
    FOR SELECT
    TO authenticated
    USING (true);

COMMENT ON TABLE public.fns_sync_history IS
    'Immutable audit history of public FNS proposal synchronizations.';
