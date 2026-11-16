ALTER TABLE public.repasses
  ADD COLUMN IF NOT EXISTS bank_code text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS branch_number text,
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS banking_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS fns_payment_data jsonb;

COMMENT ON COLUMN public.repasses.banking_verified_at IS
  'When bank data was directly verified against the public FNS detailed-payment response.';
