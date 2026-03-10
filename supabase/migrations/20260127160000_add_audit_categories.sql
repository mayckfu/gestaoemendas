-- Migration to add audit categories to destinations and ensure consistency in expenses

-- Add grupo_despesa to destinacoes_recursos
ALTER TABLE public.destinacoes_recursos 
ADD COLUMN IF NOT EXISTS grupo_despesa TEXT CHECK (grupo_despesa IN ('SERVIÇOS TERCEIROS (PJ)', 'MATERIAL DE CONSUMO', 'DISTRIBUIÇÃO GRATUITA', 'OUTROS'));

-- We don't strictly enforce the check constraint on existing tables to avoid breaking changes if data exists, 
-- but for the purpose of this feature we will use these values.

-- Update despesas table to encourage using the new categories
-- We won't add a check constraint to 'categoria' in 'despesas' to maintain flexibility, 
-- but the UI will enforce the selection of these specific values.
