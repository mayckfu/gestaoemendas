-- Laura Institutional Knowledge Base
-- Structured "second brain" for technical memory, facts, links, tags, context, and audit.
-- The official database remains the source of truth. Laura writes only to knowledge/memory tables.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$
BEGIN
  CREATE TYPE public.knowledge_status AS ENUM (
    'rascunho',
    'validado',
    'pendente_confirmacao',
    'obsoleto',
    'rejeitado'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.knowledge_source_type AS ENUM (
    'banco_oficial',
    'documento_anexado',
    'memoria_consolidada',
    'historico_chat',
    'inferencia_ia',
    'usuario'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.knowledge_actor_type AS ENUM (
    'user',
    'laura',
    'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.knowledge_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  content text NOT NULL DEFAULT '',
  note_type text NOT NULL DEFAULT 'nota_tecnica' CHECK (
    note_type IN (
      'nota_tecnica',
      'proposta',
      'emenda',
      'diligencia',
      'unidade',
      'cnes',
      'portaria',
      'cib',
      'pas',
      'pms',
      'modelo',
      'decisao',
      'resumo',
      'regra_operacional',
      'outro'
    )
  ),
  source_type public.knowledge_source_type NOT NULL DEFAULT 'usuario',
  source_table text,
  source_id text,
  entity_type text,
  entity_id text,
  municipality text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_ai boolean NOT NULL DEFAULT false,
  status public.knowledge_status NOT NULL DEFAULT 'pendente_confirmacao',
  confidence numeric(3, 2) NOT NULL DEFAULT 0.60 CHECK (confidence >= 0 AND confidence <= 1),
  last_confirmed_at timestamptz,
  obsolete_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector(
      'portuguese',
      coalesce(title, '') || ' ' ||
      coalesce(content, '') || ' ' ||
      coalesce(entity_type, '') || ' ' ||
      coalesce(entity_id, '') || ' ' ||
      coalesce(municipality, '')
    )
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    status <> 'validado'
    OR source_type IN ('banco_oficial', 'documento_anexado', 'usuario')
  )
);

COMMENT ON TABLE public.knowledge_notes IS
  'Consolidated institutional knowledge notes used by Laura. Not raw chat history.';

CREATE TABLE IF NOT EXISTS public.knowledge_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  fact_key text NOT NULL,
  fact_value text NOT NULL,
  fact_value_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_type public.knowledge_source_type NOT NULL DEFAULT 'inferencia_ia',
  source_table text,
  source_id text,
  source_updated_at timestamptz,
  confidence numeric(3, 2) NOT NULL DEFAULT 0.60 CHECK (confidence >= 0 AND confidence <= 1),
  status public.knowledge_status NOT NULL DEFAULT 'pendente_confirmacao',
  confirmed_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_ai boolean NOT NULL DEFAULT true,
  obsolete_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_facts_unique_entity_key UNIQUE (entity_type, entity_id, fact_key),
  CHECK (
    status <> 'validado'
    OR source_type IN ('banco_oficial', 'documento_anexado')
  )
);

COMMENT ON TABLE public.knowledge_facts IS
  'Objective reusable facts. One current fact per entity_type/entity_id/fact_key.';

CREATE TABLE IF NOT EXISTS public.knowledge_fact_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fact_id uuid NOT NULL REFERENCES public.knowledge_facts(id) ON DELETE CASCADE,
  old_fact_value text,
  new_fact_value text,
  old_status public.knowledge_status,
  new_status public.knowledge_status,
  old_confidence numeric(3, 2),
  new_confidence numeric(3, 2),
  change_reason text,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_by_ai boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.knowledge_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  relation_type text NOT NULL CHECK (
    relation_type IN (
      'vinculada_a',
      'fundamentada_por',
      'fundamenta',
      'responde_a',
      'complementa',
      'substitui',
      'relacionada_a',
      'pertence_a',
      'trata_de',
      'usa_modelo_de',
      'corrige',
      'origina'
    )
  ),
  source_table text,
  source_record_id text,
  confidence numeric(3, 2) NOT NULL DEFAULT 0.70 CHECK (confidence >= 0 AND confidence <= 1),
  status public.knowledge_status NOT NULL DEFAULT 'pendente_confirmacao',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_ai boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_links_unique_relation UNIQUE (
    source_type,
    source_id,
    target_type,
    target_id,
    relation_type
  )
);

CREATE TABLE IF NOT EXISTS public.knowledge_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.knowledge_note_tags (
  note_id uuid NOT NULL REFERENCES public.knowledge_notes(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.knowledge_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (note_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  active_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content text NOT NULL,
  active_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  sources_used jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.chat_messages IS
  'Raw chat history. This is not validated institutional memory.';

CREATE TABLE IF NOT EXISTS public.ai_memory_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_question text,
  ai_answer text,
  extracted_learning jsonb NOT NULL DEFAULT '{}'::jsonb,
  memory_type text,
  related_entity_type text,
  related_entity_id text,
  should_reuse boolean NOT NULL DEFAULT false,
  action_taken text NOT NULL DEFAULT 'none' CHECK (
    action_taken IN (
      'none',
      'created_fact',
      'updated_fact',
      'created_note',
      'created_link',
      'marked_obsolete',
      'pending_review',
      'rejected'
    )
  ),
  sources_consulted jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence numeric(3, 2) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.laura_active_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active_entity_type text,
  active_entity_id text,
  active_entity_label text,
  current_screen text,
  document_id text,
  last_question text,
  last_record_type text,
  last_record_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT laura_active_contexts_user_unique UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.knowledge_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_type public.knowledge_actor_type NOT NULL DEFAULT 'user',
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_notes_status_type
  ON public.knowledge_notes(status, note_type, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_notes_entity
  ON public.knowledge_notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_notes_search
  ON public.knowledge_notes USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_knowledge_notes_title_trgm
  ON public.knowledge_notes USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_knowledge_facts_entity
  ON public.knowledge_facts(entity_type, entity_id, status);
CREATE INDEX IF NOT EXISTS idx_knowledge_facts_key
  ON public.knowledge_facts(fact_key, status);
CREATE INDEX IF NOT EXISTS idx_knowledge_facts_value_trgm
  ON public.knowledge_facts USING gin(fact_value gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_knowledge_fact_versions_fact
  ON public.knowledge_fact_versions(fact_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_knowledge_links_source
  ON public.knowledge_links(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_target
  ON public.knowledge_links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
  ON public.chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created
  ON public.chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_memory_events_user_created
  ON public.ai_memory_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_memory_events_entity
  ON public.ai_memory_events(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_audit_logs_record
  ON public.knowledge_audit_logs(table_name, record_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_knowledge_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_knowledge_notes_updated_at ON public.knowledge_notes;
CREATE TRIGGER update_knowledge_notes_updated_at
  BEFORE UPDATE ON public.knowledge_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_knowledge_updated_at();

DROP TRIGGER IF EXISTS update_knowledge_facts_updated_at ON public.knowledge_facts;
CREATE TRIGGER update_knowledge_facts_updated_at
  BEFORE UPDATE ON public.knowledge_facts
  FOR EACH ROW EXECUTE FUNCTION public.update_knowledge_updated_at();

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_knowledge_updated_at();

CREATE OR REPLACE FUNCTION public.update_laura_active_context_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_laura_active_context_updated_at ON public.laura_active_contexts;
CREATE TRIGGER update_laura_active_context_updated_at
  BEFORE UPDATE ON public.laura_active_contexts
  FOR EACH ROW EXECUTE FUNCTION public.update_laura_active_context_updated_at();

CREATE OR REPLACE FUNCTION public.knowledge_audit_trigger_func()
RETURNS trigger AS $$
DECLARE
  v_record_id text;
  v_created_by_ai boolean := false;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id::text;
    v_created_by_ai := COALESCE(OLD.created_by_ai, false);
  ELSE
    v_record_id := NEW.id::text;
    v_created_by_ai := COALESCE(NEW.created_by_ai, false);
  END IF;

  INSERT INTO public.knowledge_audit_logs (
    actor_user_id,
    actor_type,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  )
  VALUES (
    auth.uid(),
    CASE WHEN TG_TABLE_NAME IN ('knowledge_facts', 'knowledge_notes', 'knowledge_links') AND v_created_by_ai
         THEN 'laura'::public.knowledge_actor_type
         ELSE 'user'::public.knowledge_actor_type
    END,
    TG_OP,
    TG_TABLE_NAME,
    v_record_id,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS audit_knowledge_notes ON public.knowledge_notes;
CREATE TRIGGER audit_knowledge_notes
  AFTER INSERT OR UPDATE OR DELETE ON public.knowledge_notes
  FOR EACH ROW EXECUTE FUNCTION public.knowledge_audit_trigger_func();

DROP TRIGGER IF EXISTS audit_knowledge_facts ON public.knowledge_facts;
CREATE TRIGGER audit_knowledge_facts
  AFTER INSERT OR UPDATE OR DELETE ON public.knowledge_facts
  FOR EACH ROW EXECUTE FUNCTION public.knowledge_audit_trigger_func();

DROP TRIGGER IF EXISTS audit_knowledge_links ON public.knowledge_links;
CREATE TRIGGER audit_knowledge_links
  AFTER INSERT OR UPDATE OR DELETE ON public.knowledge_links
  FOR EACH ROW EXECUTE FUNCTION public.knowledge_audit_trigger_func();

CREATE OR REPLACE FUNCTION public.laura_upsert_knowledge_fact(
  p_entity_type text,
  p_entity_id text,
  p_fact_key text,
  p_fact_value text,
  p_source_type public.knowledge_source_type DEFAULT 'inferencia_ia',
  p_source_table text DEFAULT NULL,
  p_source_id text DEFAULT NULL,
  p_confidence numeric DEFAULT 0.60,
  p_status public.knowledge_status DEFAULT 'pendente_confirmacao',
  p_created_by_ai boolean DEFAULT true,
  p_reason text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_existing public.knowledge_facts%ROWTYPE;
  v_fact_id uuid;
  v_status public.knowledge_status := p_status;
  v_confidence numeric(3, 2) := LEAST(GREATEST(COALESCE(p_confidence, 0.60), 0), 1);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_entity_type IS NULL OR p_entity_id IS NULL OR p_fact_key IS NULL OR p_fact_value IS NULL THEN
    RAISE EXCEPTION 'entity_type, entity_id, fact_key and fact_value are required';
  END IF;

  IF v_status = 'validado' AND p_source_type NOT IN ('banco_oficial', 'documento_anexado') THEN
    v_status := 'pendente_confirmacao';
  END IF;

  SELECT *
  INTO v_existing
  FROM public.knowledge_facts
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND fact_key = p_fact_key;

  IF FOUND THEN
    IF v_existing.fact_value IS DISTINCT FROM p_fact_value
      OR v_existing.status IS DISTINCT FROM v_status
      OR v_existing.confidence IS DISTINCT FROM v_confidence THEN

      INSERT INTO public.knowledge_fact_versions (
        fact_id,
        old_fact_value,
        new_fact_value,
        old_status,
        new_status,
        old_confidence,
        new_confidence,
        change_reason,
        changed_by,
        changed_by_ai
      )
      VALUES (
        v_existing.id,
        v_existing.fact_value,
        p_fact_value,
        v_existing.status,
        v_status,
        v_existing.confidence,
        v_confidence,
        COALESCE(p_reason, 'Laura atualizou fato consolidado'),
        auth.uid(),
        p_created_by_ai
      );

      UPDATE public.knowledge_facts
      SET fact_value = p_fact_value,
          source_type = p_source_type,
          source_table = p_source_table,
          source_id = p_source_id,
          confidence = v_confidence,
          status = v_status,
          confirmed_at = CASE WHEN v_status = 'validado' THEN now() ELSE confirmed_at END,
          created_by = COALESCE(created_by, auth.uid()),
          created_by_ai = p_created_by_ai,
          obsolete_reason = NULL,
          updated_at = now()
      WHERE id = v_existing.id
      RETURNING id INTO v_fact_id;
    ELSE
      v_fact_id := v_existing.id;
    END IF;

    RETURN v_fact_id;
  END IF;

  INSERT INTO public.knowledge_facts (
    entity_type,
    entity_id,
    fact_key,
    fact_value,
    source_type,
    source_table,
    source_id,
    confidence,
    status,
    confirmed_at,
    created_by,
    created_by_ai
  )
  VALUES (
    p_entity_type,
    p_entity_id,
    p_fact_key,
    p_fact_value,
    p_source_type,
    p_source_table,
    p_source_id,
    v_confidence,
    v_status,
    CASE WHEN v_status = 'validado' THEN now() ELSE NULL END,
    auth.uid(),
    p_created_by_ai
  )
  RETURNING id INTO v_fact_id;

  RETURN v_fact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.laura_set_official_fact(
  p_entity_type text,
  p_entity_id text,
  p_fact_key text,
  p_fact_value text,
  p_source_table text,
  p_source_id text
)
RETURNS uuid AS $$
DECLARE
  v_existing public.knowledge_facts%ROWTYPE;
  v_fact_id uuid;
BEGIN
  IF p_entity_type IS NULL OR p_entity_id IS NULL OR p_fact_key IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_fact_value IS NULL OR length(trim(p_fact_value)) = 0 THEN
    RETURN NULL;
  END IF;

  SELECT *
  INTO v_existing
  FROM public.knowledge_facts
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND fact_key = p_fact_key;

  IF FOUND THEN
    IF v_existing.fact_value IS DISTINCT FROM p_fact_value
      OR v_existing.status IS DISTINCT FROM 'validado'::public.knowledge_status
      OR v_existing.confidence IS DISTINCT FROM 1.00 THEN

      INSERT INTO public.knowledge_fact_versions (
        fact_id,
        old_fact_value,
        new_fact_value,
        old_status,
        new_status,
        old_confidence,
        new_confidence,
        change_reason,
        changed_by_ai
      )
      VALUES (
        v_existing.id,
        v_existing.fact_value,
        p_fact_value,
        v_existing.status,
        'validado',
        v_existing.confidence,
        1.00,
        'Atualizado automaticamente a partir do banco oficial',
        true
      );

      UPDATE public.knowledge_facts
      SET fact_value = p_fact_value,
          source_type = 'banco_oficial',
          source_table = p_source_table,
          source_id = p_source_id,
          confidence = 1.00,
          status = 'validado',
          confirmed_at = now(),
          created_by_ai = true,
          obsolete_reason = NULL,
          updated_at = now()
      WHERE id = v_existing.id
      RETURNING id INTO v_fact_id;
    ELSE
      v_fact_id := v_existing.id;
    END IF;

    RETURN v_fact_id;
  END IF;

  INSERT INTO public.knowledge_facts (
    entity_type,
    entity_id,
    fact_key,
    fact_value,
    source_type,
    source_table,
    source_id,
    confidence,
    status,
    confirmed_at,
    created_by_ai
  )
  VALUES (
    p_entity_type,
    p_entity_id,
    p_fact_key,
    p_fact_value,
    'banco_oficial',
    p_source_table,
    p_source_id,
    1.00,
    'validado',
    now(),
    true
  )
  RETURNING id INTO v_fact_id;

  RETURN v_fact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.laura_sync_emenda_knowledge()
RETURNS trigger AS $$
DECLARE
  v_entity_type text;
  v_entity_id text;
  v_old_entity_type text;
  v_old_entity_id text;
BEGIN
  v_entity_type := CASE WHEN NULLIF(NEW.numero_proposta, '') IS NOT NULL THEN 'proposta' ELSE 'emenda' END;
  v_entity_id := COALESCE(NULLIF(NEW.numero_proposta, ''), NULLIF(NEW.numero_emenda, ''), NEW.id::text);

  IF TG_OP = 'UPDATE' THEN
    v_old_entity_type := CASE WHEN NULLIF(OLD.numero_proposta, '') IS NOT NULL THEN 'proposta' ELSE 'emenda' END;
    v_old_entity_id := COALESCE(NULLIF(OLD.numero_proposta, ''), NULLIF(OLD.numero_emenda, ''), OLD.id::text);

    IF v_old_entity_type IS DISTINCT FROM v_entity_type OR v_old_entity_id IS DISTINCT FROM v_entity_id THEN
      UPDATE public.knowledge_facts
      SET status = 'obsoleto',
          obsolete_reason = 'Identificador oficial da emenda/proposta mudou',
          updated_at = now()
      WHERE source_table = 'emendas'
        AND source_id = OLD.id::text
        AND entity_type = v_old_entity_type
        AND entity_id = v_old_entity_id;
    END IF;
  END IF;

  PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'id', NEW.id::text, 'emendas', NEW.id::text);
  PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'numero_proposta', NEW.numero_proposta, 'emendas', NEW.id::text);
  PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'numero_emenda', NEW.numero_emenda, 'emendas', NEW.id::text);
  PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'valor_total', NEW.valor_total::text, 'emendas', NEW.id::text);
  PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'valor_repasse', NEW.valor_repasse::text, 'emendas', NEW.id::text);
  PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'objeto', NEW.objeto_emenda, 'emendas', NEW.id::text);
  PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'parlamentar', NEW.parlamentar, 'emendas', NEW.id::text);
  PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'autor', NEW.autor, 'emendas', NEW.id::text);
  PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'situacao', NEW.situacao::text, 'emendas', NEW.id::text);
  PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'status_interno', NEW.status_interno::text, 'emendas', NEW.id::text);
  PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'tipo', NEW.tipo::text, 'emendas', NEW.id::text);
  PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'tipo_recurso', NEW.tipo_recurso::text, 'emendas', NEW.id::text);
  PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'destino_recurso', NEW.destino_recurso, 'emendas', NEW.id::text);
  PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'portaria', NEW.portaria, 'emendas', NEW.id::text);
  PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'data_repasse', NEW.data_repasse::text, 'emendas', NEW.id::text);
  PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'situacao_recurso', NEW.situacao_recurso, 'emendas', NEW.id::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_emenda_knowledge_facts ON public.emendas;
CREATE TRIGGER sync_emenda_knowledge_facts
  AFTER INSERT OR UPDATE OF
    numero_proposta,
    numero_emenda,
    valor_total,
    valor_repasse,
    objeto_emenda,
    parlamentar,
    autor,
    situacao,
    status_interno,
    tipo,
    tipo_recurso,
    destino_recurso,
    portaria,
    data_repasse,
    situacao_recurso
  ON public.emendas
  FOR EACH ROW EXECUTE FUNCTION public.laura_sync_emenda_knowledge();

CREATE OR REPLACE FUNCTION public.laura_build_context(
  p_question text,
  p_active_context jsonb DEFAULT '{}'::jsonb,
  p_limit integer DEFAULT 12
)
RETURNS jsonb AS $$
DECLARE
  v_question text := NULLIF(trim(COALESCE(p_question, '')), '');
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 12), 1), 50);
  v_entity_type text;
  v_entity_id text;
  v_numero_proposta text;
  v_numero_emenda text;
  v_emenda_id text;
  v_facts jsonb := '[]'::jsonb;
  v_notes jsonb := '[]'::jsonb;
  v_links jsonb := '[]'::jsonb;
  v_official jsonb := '[]'::jsonb;
BEGIN
  v_entity_type := NULLIF(COALESCE(
    p_active_context->>'entity_type',
    p_active_context->>'active_entity_type'
  ), '');

  v_entity_id := NULLIF(COALESCE(
    p_active_context->>'entity_id',
    p_active_context->>'active_entity_id',
    p_active_context->>'numero_proposta',
    p_active_context->>'numero_emenda',
    p_active_context->>'emenda_id'
  ), '');

  v_numero_proposta := NULLIF(p_active_context->>'numero_proposta', '');
  v_numero_emenda := NULLIF(p_active_context->>'numero_emenda', '');
  v_emenda_id := NULLIF(p_active_context->>'emenda_id', '');

  SELECT COALESCE(jsonb_agg(to_jsonb(f)), '[]'::jsonb)
  INTO v_facts
  FROM (
    SELECT
      id,
      entity_type,
      entity_id,
      fact_key,
      fact_value,
      source_type,
      source_table,
      source_id,
      confidence,
      status,
      confirmed_at,
      updated_at
    FROM public.knowledge_facts
    WHERE status IN ('validado', 'pendente_confirmacao')
      AND (
        (v_entity_type IS NOT NULL AND v_entity_id IS NOT NULL AND entity_type = v_entity_type AND entity_id = v_entity_id)
        OR (v_entity_id IS NOT NULL AND entity_id = v_entity_id)
        OR (
          v_question IS NOT NULL
          AND (
            fact_value ILIKE '%' || v_question || '%'
            OR fact_key ILIKE '%' || v_question || '%'
            OR entity_id ILIKE '%' || v_question || '%'
          )
        )
      )
    ORDER BY
      CASE status WHEN 'validado' THEN 0 ELSE 1 END,
      confidence DESC,
      updated_at DESC
    LIMIT v_limit
  ) f;

  SELECT COALESCE(jsonb_agg(to_jsonb(n)), '[]'::jsonb)
  INTO v_notes
  FROM (
    SELECT
      id,
      title,
      content,
      note_type,
      source_type,
      source_table,
      source_id,
      entity_type,
      entity_id,
      municipality,
      status,
      confidence,
      last_confirmed_at,
      updated_at
    FROM public.knowledge_notes
    WHERE status IN ('validado', 'pendente_confirmacao', 'rascunho')
      AND (
        (v_entity_type IS NOT NULL AND v_entity_id IS NOT NULL AND entity_type = v_entity_type AND entity_id = v_entity_id)
        OR (v_entity_id IS NOT NULL AND entity_id = v_entity_id)
        OR (
          v_question IS NOT NULL
          AND (
            search_vector @@ websearch_to_tsquery('portuguese', v_question)
            OR title ILIKE '%' || v_question || '%'
            OR content ILIKE '%' || v_question || '%'
          )
        )
      )
    ORDER BY
      CASE status WHEN 'validado' THEN 0 WHEN 'pendente_confirmacao' THEN 1 ELSE 2 END,
      confidence DESC,
      updated_at DESC
    LIMIT v_limit
  ) n;

  SELECT COALESCE(jsonb_agg(to_jsonb(l)), '[]'::jsonb)
  INTO v_links
  FROM (
    SELECT
      id,
      source_type,
      source_id,
      target_type,
      target_id,
      relation_type,
      source_table,
      source_record_id,
      confidence,
      status,
      created_at
    FROM public.knowledge_links
    WHERE status IN ('validado', 'pendente_confirmacao')
      AND (
        (v_entity_type IS NOT NULL AND v_entity_id IS NOT NULL AND source_type = v_entity_type AND source_id = v_entity_id)
        OR (v_entity_type IS NOT NULL AND v_entity_id IS NOT NULL AND target_type = v_entity_type AND target_id = v_entity_id)
        OR (v_entity_id IS NOT NULL AND (source_id = v_entity_id OR target_id = v_entity_id))
      )
    ORDER BY confidence DESC, created_at DESC
    LIMIT v_limit
  ) l;

  SELECT COALESCE(jsonb_agg(to_jsonb(e)), '[]'::jsonb)
  INTO v_official
  FROM (
    SELECT
      id,
      numero_emenda,
      numero_proposta,
      parlamentar,
      autor,
      valor_total,
      valor_repasse,
      situacao,
      status_interno,
      ano_exercicio,
      origem,
      destino_recurso,
      objeto_emenda,
      descricao_completa,
      observacoes,
      tipo,
      tipo_recurso,
      natureza,
      portaria,
      data_repasse,
      situacao_recurso,
      updated_at
    FROM public.emendas
    WHERE
      (v_emenda_id IS NOT NULL AND id::text = v_emenda_id)
      OR (v_numero_proposta IS NOT NULL AND numero_proposta = v_numero_proposta)
      OR (v_numero_emenda IS NOT NULL AND numero_emenda = v_numero_emenda)
      OR (v_entity_id IS NOT NULL AND (numero_proposta = v_entity_id OR numero_emenda = v_entity_id OR id::text = v_entity_id))
      OR (
        v_question IS NOT NULL
        AND (
          numero_proposta ILIKE '%' || v_question || '%'
          OR numero_emenda ILIKE '%' || v_question || '%'
          OR parlamentar ILIKE '%' || v_question || '%'
          OR autor ILIKE '%' || v_question || '%'
          OR objeto_emenda ILIKE '%' || v_question || '%'
          OR portaria ILIKE '%' || v_question || '%'
        )
      )
    ORDER BY updated_at DESC NULLS LAST, created_at DESC
    LIMIT v_limit
  ) e;

  RETURN jsonb_build_object(
    'question', p_question,
    'active_context', COALESCE(p_active_context, '{}'::jsonb),
    'facts', v_facts,
    'notes', v_notes,
    'links', v_links,
    'official_records', v_official,
    'source_priority', jsonb_build_array(
      'knowledge_facts',
      'knowledge_notes',
      'knowledge_links',
      'official_database'
    ),
    'rules', jsonb_build_object(
      'official_database_wins_conflicts', true,
      'validated_critical_facts_require_official_or_document_source', true,
      'raw_chat_is_not_validated_memory', true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.laura_log_memory_event(
  p_session_id uuid,
  p_user_question text,
  p_ai_answer text,
  p_extracted_learning jsonb DEFAULT '{}'::jsonb,
  p_memory_type text DEFAULT NULL,
  p_related_entity_type text DEFAULT NULL,
  p_related_entity_id text DEFAULT NULL,
  p_should_reuse boolean DEFAULT false,
  p_action_taken text DEFAULT 'none',
  p_sources_consulted jsonb DEFAULT '[]'::jsonb,
  p_confidence numeric DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.ai_memory_events (
    session_id,
    user_id,
    user_question,
    ai_answer,
    extracted_learning,
    memory_type,
    related_entity_type,
    related_entity_id,
    should_reuse,
    action_taken,
    sources_consulted,
    confidence
  )
  VALUES (
    p_session_id,
    auth.uid(),
    p_user_question,
    p_ai_answer,
    COALESCE(p_extracted_learning, '{}'::jsonb),
    p_memory_type,
    p_related_entity_type,
    p_related_entity_id,
    COALESCE(p_should_reuse, false),
    COALESCE(p_action_taken, 'none'),
    COALESCE(p_sources_consulted, '[]'::jsonb),
    p_confidence
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER TABLE public.knowledge_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_fact_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laura_active_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_audit_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.knowledge_notes TO authenticated;
GRANT SELECT ON public.knowledge_facts TO authenticated;
GRANT SELECT ON public.knowledge_fact_versions TO authenticated;
GRANT SELECT ON public.knowledge_links TO authenticated;
GRANT SELECT ON public.knowledge_tags TO authenticated;
GRANT SELECT ON public.knowledge_note_tags TO authenticated;
GRANT SELECT ON public.knowledge_audit_logs TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.knowledge_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.knowledge_facts TO authenticated;
GRANT SELECT, INSERT ON public.knowledge_fact_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.knowledge_links TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.knowledge_tags TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.knowledge_note_tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_memory_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.laura_active_contexts TO authenticated;

GRANT EXECUTE ON FUNCTION public.laura_upsert_knowledge_fact(
  text,
  text,
  text,
  text,
  public.knowledge_source_type,
  text,
  text,
  numeric,
  public.knowledge_status,
  boolean,
  text
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.laura_build_context(text, jsonb, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.laura_log_memory_event(
  uuid,
  text,
  text,
  jsonb,
  text,
  text,
  text,
  boolean,
  text,
  jsonb,
  numeric
) TO authenticated;

DROP POLICY IF EXISTS "Knowledge notes read authenticated" ON public.knowledge_notes;
CREATE POLICY "Knowledge notes read authenticated"
ON public.knowledge_notes FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Knowledge notes write technical roles" ON public.knowledge_notes;
CREATE POLICY "Knowledge notes write technical roles"
ON public.knowledge_notes FOR INSERT TO authenticated
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA') OR created_by = auth.uid());

DROP POLICY IF EXISTS "Knowledge notes update technical roles" ON public.knowledge_notes;
CREATE POLICY "Knowledge notes update technical roles"
ON public.knowledge_notes FOR UPDATE TO authenticated
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA') OR created_by = auth.uid())
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA') OR created_by = auth.uid());

DROP POLICY IF EXISTS "Knowledge facts read authenticated" ON public.knowledge_facts;
CREATE POLICY "Knowledge facts read authenticated"
ON public.knowledge_facts FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Knowledge facts write technical roles" ON public.knowledge_facts;
CREATE POLICY "Knowledge facts write technical roles"
ON public.knowledge_facts FOR INSERT TO authenticated
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA') OR created_by = auth.uid());

DROP POLICY IF EXISTS "Knowledge facts update technical roles" ON public.knowledge_facts;
CREATE POLICY "Knowledge facts update technical roles"
ON public.knowledge_facts FOR UPDATE TO authenticated
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA') OR created_by = auth.uid() OR created_by_ai = true)
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA') OR created_by = auth.uid() OR created_by_ai = true);

DROP POLICY IF EXISTS "Knowledge fact versions read authenticated" ON public.knowledge_fact_versions;
CREATE POLICY "Knowledge fact versions read authenticated"
ON public.knowledge_fact_versions FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Knowledge fact versions insert technical roles" ON public.knowledge_fact_versions;
CREATE POLICY "Knowledge fact versions insert technical roles"
ON public.knowledge_fact_versions FOR INSERT TO authenticated
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA') OR changed_by = auth.uid() OR changed_by_ai = true);

DROP POLICY IF EXISTS "Knowledge links read authenticated" ON public.knowledge_links;
CREATE POLICY "Knowledge links read authenticated"
ON public.knowledge_links FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Knowledge links write technical roles" ON public.knowledge_links;
CREATE POLICY "Knowledge links write technical roles"
ON public.knowledge_links FOR INSERT TO authenticated
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA') OR created_by = auth.uid() OR created_by_ai = true);

DROP POLICY IF EXISTS "Knowledge links update technical roles" ON public.knowledge_links;
CREATE POLICY "Knowledge links update technical roles"
ON public.knowledge_links FOR UPDATE TO authenticated
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA') OR created_by = auth.uid() OR created_by_ai = true)
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA') OR created_by = auth.uid() OR created_by_ai = true);

DROP POLICY IF EXISTS "Knowledge tags read authenticated" ON public.knowledge_tags;
CREATE POLICY "Knowledge tags read authenticated"
ON public.knowledge_tags FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Knowledge tags manage technical roles" ON public.knowledge_tags;
CREATE POLICY "Knowledge tags manage technical roles"
ON public.knowledge_tags FOR ALL TO authenticated
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'))
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

DROP POLICY IF EXISTS "Knowledge note tags read authenticated" ON public.knowledge_note_tags;
CREATE POLICY "Knowledge note tags read authenticated"
ON public.knowledge_note_tags FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Knowledge note tags manage technical roles" ON public.knowledge_note_tags;
CREATE POLICY "Knowledge note tags manage technical roles"
ON public.knowledge_note_tags FOR ALL TO authenticated
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'))
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));

DROP POLICY IF EXISTS "Chat sessions own or admin" ON public.chat_sessions;
CREATE POLICY "Chat sessions own or admin"
ON public.chat_sessions FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.get_user_role() = 'ADMIN')
WITH CHECK (user_id = auth.uid() OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Chat messages own or admin" ON public.chat_messages;
CREATE POLICY "Chat messages own or admin"
ON public.chat_messages FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.get_user_role() = 'ADMIN')
WITH CHECK (user_id = auth.uid() OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "AI memory events own or admin" ON public.ai_memory_events;
CREATE POLICY "AI memory events own or admin"
ON public.ai_memory_events FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "AI memory events insert own" ON public.ai_memory_events;
CREATE POLICY "AI memory events insert own"
ON public.ai_memory_events FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "AI memory events update technical roles" ON public.ai_memory_events;
CREATE POLICY "AI memory events update technical roles"
ON public.ai_memory_events FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.get_user_role() = 'ADMIN')
WITH CHECK (user_id = auth.uid() OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Laura active context own or admin" ON public.laura_active_contexts;
CREATE POLICY "Laura active context own or admin"
ON public.laura_active_contexts FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.get_user_role() = 'ADMIN')
WITH CHECK (user_id = auth.uid() OR public.get_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "Knowledge audit logs admin only" ON public.knowledge_audit_logs;
CREATE POLICY "Knowledge audit logs admin only"
ON public.knowledge_audit_logs FOR SELECT TO authenticated
USING (public.get_user_role() = 'ADMIN');

INSERT INTO public.knowledge_tags (name, slug)
VALUES
  ('CER', 'cer'),
  ('APS', 'aps'),
  ('MAC', 'mac'),
  ('PAP', 'pap'),
  ('CIB', 'cib'),
  ('PAS', 'pas'),
  ('PMS', 'pms'),
  ('Diligencia', 'diligencia'),
  ('Equipamento', 'equipamento'),
  ('Transporte Sanitario', 'transporte-sanitario'),
  ('Emenda Parlamentar', 'emenda-parlamentar'),
  ('Atencao Especializada', 'atencao-especializada'),
  ('Portaria', 'portaria'),
  ('CNES', 'cnes')
ON CONFLICT (slug) DO NOTHING;
