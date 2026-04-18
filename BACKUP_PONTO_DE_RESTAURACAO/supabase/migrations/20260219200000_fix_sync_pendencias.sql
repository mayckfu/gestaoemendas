-- Migration to fix and enhance the synchronization logic for emenda pendencies
-- This function is called by triggers on emendas, despesas, repasses, and anexos tables

CREATE OR REPLACE FUNCTION public.sync_emenda_pendencias()
RETURNS TRIGGER AS $$
DECLARE
    target_emenda_id uuid;
    v_emenda record;
    v_has_oficio boolean;
    v_has_repasses boolean;
    v_has_despesas boolean;
BEGIN
    -- Determine Emenda ID based on the table triggering the function
    IF TG_TABLE_NAME = 'emendas' THEN
        target_emenda_id := COALESCE(NEW.id, OLD.id);
    ELSIF TG_TABLE_NAME = 'anexos' THEN
        target_emenda_id := COALESCE(NEW.emenda_id, OLD.emenda_id);
    ELSIF TG_TABLE_NAME = 'repasses' THEN
        target_emenda_id := COALESCE(NEW.emenda_id, OLD.emenda_id);
    ELSIF TG_TABLE_NAME = 'despesas' THEN
        target_emenda_id := COALESCE(NEW.emenda_id, OLD.emenda_id);
    END IF;

    IF target_emenda_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Fetch Emenda Data
    SELECT * INTO v_emenda FROM public.emendas WHERE id = target_emenda_id;
    
    -- Check Repasses (Any record exists)
    SELECT EXISTS(SELECT 1 FROM public.repasses WHERE emenda_id = target_emenda_id) INTO v_has_repasses;

    -- Check Despesas (Any record exists)
    SELECT EXISTS(SELECT 1 FROM public.despesas WHERE emenda_id = target_emenda_id) INTO v_has_despesas;

    -- Check Anexos (Ofício de Envio) - Robust case-insensitive check
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
    IF v_emenda.destino_recurso IS NOT NULL AND TRIM(v_emenda.destino_recurso) <> '' THEN
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
    IF v_emenda.objeto_emenda IS NOT NULL AND TRIM(v_emenda.objeto_emenda) <> '' THEN
        UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'objeto_emenda';
    ELSE
        INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
        VALUES (target_emenda_id, 'Definir Objeto da Emenda', 'field', 'objeto_emenda', false)
        ON CONFLICT (emenda_id, target_id) DO UPDATE 
        SET resolvida = false
        WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'objeto_emenda' AND public.pendencias.dispensada = false;
    END IF;
    
    -- 5. Número da Proposta (Checklist Item)
    IF v_emenda.numero_proposta IS NOT NULL AND TRIM(v_emenda.numero_proposta) <> '' THEN
        UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'numero_proposta';
    ELSE
        INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
        VALUES (target_emenda_id, 'Informar Número da Proposta', 'field', 'numero_proposta', false)
        ON CONFLICT (emenda_id, target_id) DO UPDATE 
        SET resolvida = false
        WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'numero_proposta' AND public.pendencias.dispensada = false;
    END IF;

    -- 6. Portaria (Checklist Item)
    IF v_emenda.portaria IS NOT NULL AND TRIM(v_emenda.portaria) <> '' THEN
        UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'portaria';
    ELSE
        INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
        VALUES (target_emenda_id, 'Informar Portaria', 'field', 'portaria', false)
        ON CONFLICT (emenda_id, target_id) DO UPDATE 
        SET resolvida = false
        WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'portaria' AND public.pendencias.dispensada = false;
    END IF;

    -- 7. Despesas (Checklist Item)
    IF v_has_despesas THEN
        UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'despesas';
    ELSE
        INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
        VALUES (target_emenda_id, 'Registrar Despesas', 'tab', 'despesas', false)
        ON CONFLICT (emenda_id, target_id) DO UPDATE 
        SET resolvida = false
        WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'despesas' AND public.pendencias.dispensada = false;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Ensure triggers are correctly set up
-- Trigger for Despesas
DROP TRIGGER IF EXISTS sync_pendencias_on_despesas ON public.despesas;
CREATE TRIGGER sync_pendencias_on_despesas
AFTER INSERT OR UPDATE OR DELETE ON public.despesas
FOR EACH ROW EXECUTE FUNCTION public.sync_emenda_pendencias();

-- Trigger for Emendas
DROP TRIGGER IF EXISTS sync_pendencias_on_emenda ON public.emendas;
CREATE TRIGGER sync_pendencias_on_emenda
AFTER INSERT OR UPDATE ON public.emendas
FOR EACH ROW EXECUTE FUNCTION public.sync_emenda_pendencias();

-- Trigger for Anexos (ensure it exists)
DROP TRIGGER IF EXISTS sync_pendencias_on_anexos ON public.anexos;
CREATE TRIGGER sync_pendencias_on_anexos
AFTER INSERT OR UPDATE OR DELETE ON public.anexos
FOR EACH ROW EXECUTE FUNCTION public.sync_emenda_pendencias();

-- Trigger for Repasses (ensure it exists)
DROP TRIGGER IF EXISTS sync_pendencias_on_repasses ON public.repasses;
CREATE TRIGGER sync_pendencias_on_repasses
AFTER INSERT OR UPDATE OR DELETE ON public.repasses
FOR EACH ROW EXECUTE FUNCTION public.sync_emenda_pendencias();

-- Run an update on all emendas to force synchronization for existing records
UPDATE public.emendas SET updated_at = NOW();

