-- Split investment resources and limits by MAC/PAP while keeping legacy fields.

ALTER TYPE public.tipo_recurso ADD VALUE IF NOT EXISTS 'INVESTIMENTO_MAC';
ALTER TYPE public.tipo_recurso ADD VALUE IF NOT EXISTS 'INVESTIMENTO_PAP';

ALTER TABLE public.limites_exercicio
  ADD COLUMN IF NOT EXISTS limite_investimento_mac NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS limite_investimento_pap NUMERIC NOT NULL DEFAULT 0;

UPDATE public.limites_exercicio
SET limite_investimento_pap = limite_capital
WHERE limite_investimento_mac = 0
  AND limite_investimento_pap = 0
  AND limite_capital > 0;
