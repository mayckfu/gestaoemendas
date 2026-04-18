-- Rename titulo to filename in anexos
ALTER TABLE public.anexos RENAME COLUMN titulo TO filename;

-- Add new columns to anexos for better file management
ALTER TABLE public.anexos ADD COLUMN IF NOT EXISTS size NUMERIC;
ALTER TABLE public.anexos ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Ensure constraints for anexos to guarantee data integrity
ALTER TABLE public.anexos ALTER COLUMN emenda_id SET NOT NULL;

-- Ensure constraints for repasses to guarantee data integrity
ALTER TABLE public.repasses ALTER COLUMN emenda_id SET NOT NULL;

-- Ensure constraints for despesas to guarantee data integrity
ALTER TABLE public.despesas ALTER COLUMN emenda_id SET NOT NULL;

-- Ensure constraints for historico to guarantee data integrity
ALTER TABLE public.historico ALTER COLUMN emenda_id SET NOT NULL;
