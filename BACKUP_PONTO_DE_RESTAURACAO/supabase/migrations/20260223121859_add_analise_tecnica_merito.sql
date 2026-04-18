-- Adiciona novo status interno para Análise Técnica de Mérito
ALTER TYPE public.status_interno ADD VALUE IF NOT EXISTS 'ANALISE_TECNICA_MERITO';
