-- Ensure pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ANEXOS: Ensure ID has default and is NOT NULL
ALTER TABLE public.anexos ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.anexos ALTER COLUMN id SET NOT NULL;

-- DESPESAS: Ensure ID has default and is NOT NULL
ALTER TABLE public.despesas ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.despesas ALTER COLUMN id SET NOT NULL;

-- HISTORICO: Ensure ID has default and is NOT NULL
ALTER TABLE public.historico ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.historico ALTER COLUMN id SET NOT NULL;

-- PENDENCIAS: Ensure ID has default and is NOT NULL
ALTER TABLE public.pendencias ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.pendencias ALTER COLUMN id SET NOT NULL;

-- REPASSES: Ensure ID has default and is NOT NULL
ALTER TABLE public.repasses ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.repasses ALTER COLUMN id SET NOT NULL;

-- Ensure foreign keys are correct (These usually exist from initial schema but reinforcing just in case)
-- We use DO block to check if constraint exists before adding to avoid errors if re-running or if partial
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'anexos_emenda_id_fkey') THEN
        ALTER TABLE public.anexos ADD CONSTRAINT anexos_emenda_id_fkey FOREIGN KEY (emenda_id) REFERENCES public.emendas(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'despesas_emenda_id_fkey') THEN
        ALTER TABLE public.despesas ADD CONSTRAINT despesas_emenda_id_fkey FOREIGN KEY (emenda_id) REFERENCES public.emendas(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'historico_emenda_id_fkey') THEN
        ALTER TABLE public.historico ADD CONSTRAINT historico_emenda_id_fkey FOREIGN KEY (emenda_id) REFERENCES public.emendas(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pendencias_emenda_id_fkey') THEN
        ALTER TABLE public.pendencias ADD CONSTRAINT pendencias_emenda_id_fkey FOREIGN KEY (emenda_id) REFERENCES public.emendas(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'repasses_emenda_id_fkey') THEN
        ALTER TABLE public.repasses ADD CONSTRAINT repasses_emenda_id_fkey FOREIGN KEY (emenda_id) REFERENCES public.emendas(id) ON DELETE CASCADE;
    END IF;
END $$;
