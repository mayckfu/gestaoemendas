-- Migration to Auto-Resolve Pendencies based on Emenda/Anexos data

-- Ensure we have a unique constraint on (emenda_id, target_id) to safely UPSERT pendencies
CREATE UNIQUE INDEX IF NOT EXISTS idx_pendencias_emenda_target ON public.pendencias (emenda_id, target_id);

CREATE OR REPLACE FUNCTION public.sync_emenda_pendencias()
RETURNS TRIGGER AS $$
DECLARE
    target_emenda_id uuid;
    v_emenda record;
    v_has_oficio boolean;
    v_has_proposta boolean;
BEGIN
    -- Determine Emenda ID based on the table triggering the function
    IF TG_TABLE_NAME = 'emendas' THEN
        target_emenda_id := NEW.id;
    ELSIF TG_TABLE_NAME = 'anexos' THEN
        target_emenda_id := COALESCE(NEW.emenda_id, OLD.emenda_id);
    END IF;

    IF target_emenda_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Fetch Emenda Data
    SELECT * INTO v_emenda FROM public.emendas WHERE id = target_emenda_id;
    
    -- Check Anexos
    SELECT EXISTS(SELECT 1 FROM public.anexos WHERE emenda_id = target_emenda_id AND tipo = 'OFICIO') INTO v_has_oficio;
    
    -- 1. Valor do Repasse
    IF v_emenda.valor_repasse IS NOT NULL AND v_emenda.valor_repasse > 0 THEN
        -- Resolve if criteria met
        UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'valor_repasse';
    ELSE
        -- Ensure pendency exists and is not resolved (unless dispensed)
        INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
        VALUES (target_emenda_id, 'Definir Valor do Repasse', 'field', 'valor_repasse', false)
        ON CONFLICT (emenda_id, target_id) DO UPDATE 
        SET resolvida = false
        WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'valor_repasse' AND public.pendencias.dispensada = false;
    END IF;

    -- 2. Destino do Recurso
    IF v_emenda.destino_recurso IS NOT NULL AND v_emenda.destino_recurso <> '' THEN
        UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'destino_recurso';
    ELSE
        INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
        VALUES (target_emenda_id, 'Informar Destino do Recurso', 'field', 'destino_recurso', false)
        ON CONFLICT (emenda_id, target_id) DO UPDATE 
        SET resolvida = false
        WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'destino_recurso' AND public.pendencias.dispensada = false;
    END IF;

    -- 3. Ofício de Envio
    IF v_has_oficio THEN
        UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'OFICIO';
    ELSE
        INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
        VALUES (target_emenda_id, 'Anexar Ofício de Envio', 'anexo', 'OFICIO', false)
        ON CONFLICT (emenda_id, target_id) DO UPDATE 
        SET resolvida = false
        WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'OFICIO' AND public.pendencias.dispensada = false;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
DROP TRIGGER IF EXISTS sync_pendencias_on_emenda ON public.emendas;
CREATE TRIGGER sync_pendencias_on_emenda
AFTER INSERT OR UPDATE ON public.emendas
FOR EACH ROW EXECUTE FUNCTION public.sync_emenda_pendencias();

DROP TRIGGER IF EXISTS sync_pendencias_on_anexos ON public.anexos;
CREATE TRIGGER sync_pendencias_on_anexos
AFTER INSERT OR UPDATE OR DELETE ON public.anexos
FOR EACH ROW EXECUTE FUNCTION public.sync_emenda_pendencias();
