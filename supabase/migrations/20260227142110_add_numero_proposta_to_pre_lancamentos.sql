-- Adicionar numero_proposta na tabela pre_lancamentos
ALTER TABLE public.pre_lancamentos ADD COLUMN IF NOT EXISTS numero_proposta text;

-- Remover a constraint unique de numero_emenda
ALTER TABLE public.pre_lancamentos DROP CONSTRAINT IF EXISTS pre_lancamentos_numero_emenda_key;

-- Adicionar constraint unique em numero_proposta
ALTER TABLE public.pre_lancamentos ADD CONSTRAINT pre_lancamentos_numero_proposta_key UNIQUE (numero_proposta);
