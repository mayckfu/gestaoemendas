CREATE OR REPLACE FUNCTION public.sync_emenda_pendencias()
RETURNS TRIGGER AS $$
DECLARE
    target_emenda_id uuid;
    v_emenda record;
    v_has_oficio boolean;
    v_has_repasses boolean;
BEGIN
    -- Determine Emenda ID based on the table triggering the function
    IF TG_TABLE_NAME = 'emendas' THEN
        target_emenda_id := NEW.id;
    ELSIF TG_TABLE_NAME = 'anexos' THEN
        target_emenda_id := COALESCE(NEW.emenda_id, OLD.emenda_id);
    ELSIF TG_TABLE_NAME = 'repasses' THEN
        target_emenda_id := COALESCE(NEW.emenda_id, OLD.emenda_id);
    END IF;

    IF target_emenda_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Fetch Emenda Data
    SELECT * INTO v_emenda FROM public.emendas WHERE id = target_emenda_id;
    
    -- Check Repasses (Any record exists)
    SELECT EXISTS(SELECT 1 FROM public.repasses WHERE emenda_id = target_emenda_id) INTO v_has_repasses;

    -- Check Anexos (Ofício de Envio)
    -- Matches filename or tipo containing "Ofício de Envio" OR type is 'OFICIO'
    -- Case insensitive matching for flexibility
    SELECT EXISTS(
        SELECT 1 FROM public.anexos 
        WHERE emenda_id = target_emenda_id 
        AND (
            tipo = 'OFICIO' OR
            tipo ILIKE '%ofício de envio%' OR
            tipo ILIKE '%oficio de envio%' OR
            filename ILIKE '%ofício de envio%' OR
            filename ILIKE '%oficio de envio%'
        )
    ) INTO v_has_oficio;
    
    -- 1. Valor do Repasse (Checklist Item)
    -- Resolved if field > 0 OR repasses table has entries
    IF (v_emenda.valor_repasse IS NOT NULL AND v_emenda.valor_repasse > 0) OR v_has_repasses THEN
        UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'valor_repasse';
    ELSE
        INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
        VALUES (target_emenda_id, 'Definir Valor do Repasse', 'field', 'valor_repasse', false)
        ON CONFLICT (emenda_id, target_id) DO UPDATE 
        SET resolvida = false
        WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'valor_repasse' AND public.pendencias.dispensada = false;
    END IF;

    -- 2. Destino do Recurso (Checklist Item)
    IF v_emenda.destino_recurso IS NOT NULL AND v_emenda.destino_recurso <> '' THEN
        UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'destino_recurso';
    ELSE
        INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
        VALUES (target_emenda_id, 'Informar Destino do Recurso', 'field', 'destino_recurso', false)
        ON CONFLICT (emenda_id, target_id) DO UPDATE 
        SET resolvida = false
        WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'destino_recurso' AND public.pendencias.dispensada = false;
    END IF;

    -- 3. Ofício de Envio (Checklist Item)
    IF v_has_oficio THEN
        UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'OFICIO';
    ELSE
        INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
        VALUES (target_emenda_id, 'Anexar Ofício de Envio', 'anexo', 'OFICIO', false)
        ON CONFLICT (emenda_id, target_id) DO UPDATE 
        SET resolvida = false
        WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'OFICIO' AND public.pendencias.dispensada = false;
    END IF;

    -- 4. Objeto da Emenda (Checklist Item)
    IF v_emenda.objeto_emenda IS NOT NULL AND v_emenda.objeto_emenda <> '' THEN
        UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'objeto_emenda';
    ELSE
         INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
        VALUES (target_emenda_id, 'Definir Objeto da Emenda', 'field', 'objeto_emenda', false)
        ON CONFLICT (emenda_id, target_id) DO UPDATE 
        SET resolvida = false
        WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'objeto_emenda' AND public.pendencias.dispensada = false;
    END IF;
    
    -- 5. Número da Proposta (Checklist Item)
    IF v_emenda.numero_proposta IS NOT NULL AND v_emenda.numero_proposta <> '' THEN
        UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'numero_proposta';
    ELSE
         INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
        VALUES (target_emenda_id, 'Informar Número da Proposta', 'field', 'numero_proposta', false)
        ON CONFLICT (emenda_id, target_id) DO UPDATE 
        SET resolvida = false
        WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'numero_proposta' AND public.pendencias.dispensada = false;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Repasses (New)
DROP TRIGGER IF EXISTS sync_pendencias_on_repasses ON public.repasses;
CREATE TRIGGER sync_pendencias_on_repasses
AFTER INSERT OR UPDATE OR DELETE ON public.repasses
FOR EACH ROW EXECUTE FUNCTION public.sync_emenda_pendencias();

-- Ensure other triggers are present/updated
DROP TRIGGER IF EXISTS sync_pendencias_on_emenda ON public.emendas;
CREATE TRIGGER sync_pendencias_on_emenda
AFTER INSERT OR UPDATE ON public.emendas
FOR EACH ROW EXECUTE FUNCTION public.sync_emenda_pendencias();

DROP TRIGGER IF EXISTS sync_pendencias_on_anexos ON public.anexos;
CREATE TRIGGER sync_pendencias_on_anexos
AFTER INSERT OR UPDATE OR DELETE ON public.anexos
FOR EACH ROW EXECUTE FUNCTION public.sync_emenda_pendencias();
