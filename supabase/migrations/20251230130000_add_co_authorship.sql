ALTER TABLE public.emendas ADD COLUMN segundo_autor TEXT;
ALTER TABLE public.emendas ADD COLUMN segundo_parlamentar TEXT;
ALTER TABLE public.emendas ADD COLUMN valor_segundo_responsavel NUMERIC DEFAULT 0;
