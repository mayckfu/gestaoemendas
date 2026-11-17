CREATE TABLE IF NOT EXISTS public.fns_sync_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_group_id uuid NOT NULL,
  emenda_id uuid NOT NULL REFERENCES public.emendas(id) ON DELETE CASCADE,
  request_year integer NOT NULL,
  reason text NOT NULL CHECK (reason IN ('MANUAL', 'AUTOMATIC')),
  snapshot jsonb NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  restored_by uuid REFERENCES auth.users(id),
  restored_at timestamptz,
  UNIQUE (backup_group_id, emenda_id)
);

CREATE INDEX IF NOT EXISTS fns_sync_backups_year_created_idx
  ON public.fns_sync_backups (request_year, created_at DESC);

CREATE INDEX IF NOT EXISTS fns_sync_backups_group_idx
  ON public.fns_sync_backups (backup_group_id);

ALTER TABLE public.fns_sync_backups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view FNS backups" ON public.fns_sync_backups;
CREATE POLICY "Admins can view FNS backups"
  ON public.fns_sync_backups FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
        AND profiles.status = 'ATIVO'
    )
  );

COMMENT ON TABLE public.fns_sync_backups IS
  'Versioned snapshots created before FNS synchronization, used for administrator-approved rollback.';

CREATE OR REPLACE FUNCTION public.restore_fns_sync_backup(
  p_backup_group_id uuid,
  p_restored_by uuid
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  backup_row public.fns_sync_backups%ROWTYPE;
  amendment_row public.emendas%ROWTYPE;
  restored_count integer := 0;
BEGIN
  FOR backup_row IN
    SELECT * FROM public.fns_sync_backups
    WHERE backup_group_id = p_backup_group_id
    ORDER BY created_at, id
    FOR UPDATE
  LOOP
    SELECT * INTO amendment_row
    FROM jsonb_populate_record(NULL::public.emendas, backup_row.snapshot -> 'amendment');

    UPDATE public.emendas SET
      numero_emenda = amendment_row.numero_emenda,
      valor_total = amendment_row.valor_total,
      situacao = amendment_row.situacao,
      status_interno = amendment_row.status_interno,
      portaria = amendment_row.portaria,
      updated_at = amendment_row.updated_at
    WHERE id = backup_row.emenda_id;

    DELETE FROM public.repasses WHERE emenda_id = backup_row.emenda_id;
    INSERT INTO public.repasses
      SELECT * FROM jsonb_populate_recordset(NULL::public.repasses, backup_row.snapshot -> 'transfers');

    DELETE FROM public.anexos WHERE emenda_id = backup_row.emenda_id;
    INSERT INTO public.anexos
      SELECT * FROM jsonb_populate_recordset(NULL::public.anexos, backup_row.snapshot -> 'attachments');

    DELETE FROM public.fns_bank_accounts WHERE emenda_id = backup_row.emenda_id;
    INSERT INTO public.fns_bank_accounts
      SELECT * FROM jsonb_populate_recordset(NULL::public.fns_bank_accounts, backup_row.snapshot -> 'bank_accounts');

    UPDATE public.fns_sync_backups SET
      restored_by = p_restored_by,
      restored_at = now()
    WHERE id = backup_row.id;

    restored_count := restored_count + 1;
  END LOOP;

  IF restored_count = 0 THEN
    RAISE EXCEPTION 'Backup não encontrado';
  END IF;

  RETURN restored_count;
END;
$$;

REVOKE ALL ON FUNCTION public.restore_fns_sync_backup(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_fns_sync_backup(uuid, uuid) TO service_role;
