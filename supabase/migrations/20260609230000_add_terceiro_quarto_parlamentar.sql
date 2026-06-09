-- Add 3rd and 4th co-author columns to emendas table
ALTER TABLE public.emendas
  ADD COLUMN IF NOT EXISTS terceiro_autor text,
  ADD COLUMN IF NOT EXISTS terceiro_parlamentar text,
  ADD COLUMN IF NOT EXISTS valor_terceiro_responsavel numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quarto_autor text,
  ADD COLUMN IF NOT EXISTS quarto_parlamentar text,
  ADD COLUMN IF NOT EXISTS valor_quarto_responsavel numeric DEFAULT 0;
