-- Add new status to status_interno enum
ALTER TYPE public.status_interno ADD VALUE IF NOT EXISTS 'PROPOSTA_FAVORAVEL_AGUARDANDO_CLASSIFICACAO';
