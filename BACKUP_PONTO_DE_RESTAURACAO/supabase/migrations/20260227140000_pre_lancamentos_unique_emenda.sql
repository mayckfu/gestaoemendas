-- Adiciona constraint UNIQUE para a coluna numero_emenda na tabela pre_lancamentos
-- para evitar cadastros duplicados da mesma emenda no pré-lançamento.

ALTER TABLE public.pre_lancamentos
ADD CONSTRAINT pre_lancamentos_numero_emenda_key UNIQUE (numero_emenda);
