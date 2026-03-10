-- Migration to update destinacoes_recursos_grupo_despesa_check constraint
-- This allows 'EQUIPAMENTOS' as a valid category in destinacoes_recursos

ALTER TABLE public.destinacoes_recursos 
DROP CONSTRAINT IF EXISTS destinacoes_recursos_grupo_despesa_check;

ALTER TABLE public.destinacoes_recursos 
ADD CONSTRAINT destinacoes_recursos_grupo_despesa_check 
CHECK (grupo_despesa = ANY (ARRAY[
  'SERVIÇOS TERCEIROS (PJ)'::text, 
  'MATERIAL DE CONSUMO'::text, 
  'DISTRIBUIÇÃO GRATUITA'::text, 
  'EQUIPAMENTOS'::text, 
  'OUTROS'::text
]));
