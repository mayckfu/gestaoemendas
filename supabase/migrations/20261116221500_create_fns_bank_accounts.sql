CREATE TABLE IF NOT EXISTS public.fns_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emenda_id uuid NOT NULL REFERENCES public.emendas(id) ON DELETE CASCADE,
  fns_account_id text NOT NULL,
  beneficiary_cnpj text,
  beneficiary_name text,
  bank_code text,
  branch_number text,
  account_number text,
  account_type text,
  balance numeric(15, 2),
  balance_updated_at date,
  official_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (emenda_id, fns_account_id)
);

CREATE INDEX IF NOT EXISTS idx_fns_bank_accounts_emenda_id
  ON public.fns_bank_accounts(emenda_id);

ALTER TABLE public.fns_bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "FNS bank accounts SELECT" ON public.fns_bank_accounts;
CREATE POLICY "FNS bank accounts SELECT"
  ON public.fns_bank_accounts FOR SELECT TO authenticated
  USING (true);

COMMENT ON TABLE public.fns_bank_accounts IS
  'Public bank accounts returned by Consulta FNS for the amendment beneficiary. They are not necessarily tied to a specific proposal payment.';
