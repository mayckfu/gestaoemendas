-- Add the correct MAC/PAP limit fields for incremento resources.

ALTER TABLE public.limites_exercicio
  ADD COLUMN IF NOT EXISTS limite_incremento_mac NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS limite_incremento_pap NUMERIC NOT NULL DEFAULT 0;

UPDATE public.limites_exercicio
SET
  limite_incremento_mac = limite_investimento_mac,
  limite_incremento_pap = limite_investimento_pap
WHERE limite_incremento_mac = 0
  AND limite_incremento_pap = 0
  AND (limite_investimento_mac > 0 OR limite_investimento_pap > 0);
