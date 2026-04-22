-- Remover as constraints atuais se existirem
ALTER TABLE public.pendencias DROP CONSTRAINT IF EXISTS pendencias_emenda_id_fkey;
ALTER TABLE public.repasses DROP CONSTRAINT IF EXISTS repasses_emenda_id_fkey;
ALTER TABLE public.despesas DROP CONSTRAINT IF EXISTS despesas_emenda_id_fkey;
ALTER TABLE public.anexos DROP CONSTRAINT IF EXISTS anexos_emenda_id_fkey;
ALTER TABLE public.historico DROP CONSTRAINT IF EXISTS historico_emenda_id_fkey;

-- Recriar as constraints garantindo o ON DELETE CASCADE
ALTER TABLE public.pendencias ADD CONSTRAINT pendencias_emenda_id_fkey 
  FOREIGN KEY (emenda_id) REFERENCES public.emendas(id) ON DELETE CASCADE;

ALTER TABLE public.repasses ADD CONSTRAINT repasses_emenda_id_fkey 
  FOREIGN KEY (emenda_id) REFERENCES public.emendas(id) ON DELETE CASCADE;

ALTER TABLE public.despesas ADD CONSTRAINT despesas_emenda_id_fkey 
  FOREIGN KEY (emenda_id) REFERENCES public.emendas(id) ON DELETE CASCADE;

ALTER TABLE public.anexos ADD CONSTRAINT anexos_emenda_id_fkey 
  FOREIGN KEY (emenda_id) REFERENCES public.emendas(id) ON DELETE CASCADE;

ALTER TABLE public.historico ADD CONSTRAINT historico_emenda_id_fkey 
  FOREIGN KEY (emenda_id) REFERENCES public.emendas(id) ON DELETE CASCADE;
