-- Laura knowledge integrity refinement.
-- Adds a canonical entity registry and stronger relational guarantees without
-- removing existing data.

CREATE TABLE IF NOT EXISTS public.knowledge_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (
    entity_type IN (
      'proposta',
      'emenda',
      'unidade',
      'cnes',
      'portaria',
      'municipio',
      'documento',
      'nota',
      'fato',
      'knowledge_note',
      'knowledge_fact',
      'usuario',
      'sistema',
      'outro'
    )
  ),
  entity_id text NOT NULL CHECK (length(trim(entity_id)) > 0),
  label text,
  source_table text,
  source_id text,
  emenda_id uuid REFERENCES public.emendas(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_entities_unique_entity UNIQUE (entity_type, entity_id)
);

COMMENT ON TABLE public.knowledge_entities IS
  'Canonical registry of entities known by Laura. Facts, notes, contexts, and links can point here for integrity.';

ALTER TABLE public.knowledge_entities ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_knowledge_entities_type_id
  ON public.knowledge_entities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_emenda
  ON public.knowledge_entities(emenda_id)
  WHERE emenda_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_metadata
  ON public.knowledge_entities USING gin(metadata);

DROP TRIGGER IF EXISTS update_knowledge_entities_updated_at ON public.knowledge_entities;
CREATE TRIGGER update_knowledge_entities_updated_at
  BEFORE UPDATE ON public.knowledge_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_knowledge_updated_at();

CREATE OR REPLACE FUNCTION public.laura_try_uuid(p_value text)
RETURNS uuid AS $$
BEGIN
  IF p_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN p_value::uuid;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.laura_upsert_knowledge_entity(
  p_entity_type text,
  p_entity_id text,
  p_label text DEFAULT NULL,
  p_source_table text DEFAULT NULL,
  p_source_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_entity_id uuid;
  v_emenda_id uuid;
BEGIN
  IF p_entity_type IS NULL OR p_entity_id IS NULL OR length(trim(p_entity_id)) = 0 THEN
    RETURN NULL;
  END IF;

  IF p_source_table = 'emendas' THEN
    v_emenda_id := public.laura_try_uuid(p_source_id);
  END IF;

  INSERT INTO public.knowledge_entities (
    entity_type,
    entity_id,
    label,
    source_table,
    source_id,
    emenda_id,
    metadata
  )
  VALUES (
    p_entity_type,
    p_entity_id,
    NULLIF(trim(COALESCE(p_label, '')), ''),
    NULLIF(trim(COALESCE(p_source_table, '')), ''),
    NULLIF(trim(COALESCE(p_source_id, '')), ''),
    v_emenda_id,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  ON CONFLICT (entity_type, entity_id) DO UPDATE
  SET label = COALESCE(EXCLUDED.label, public.knowledge_entities.label),
      source_table = COALESCE(EXCLUDED.source_table, public.knowledge_entities.source_table),
      source_id = COALESCE(EXCLUDED.source_id, public.knowledge_entities.source_id),
      emenda_id = COALESCE(EXCLUDED.emenda_id, public.knowledge_entities.emenda_id),
      metadata = public.knowledge_entities.metadata || EXCLUDED.metadata,
      updated_at = now()
  RETURNING id INTO v_entity_id;

  RETURN v_entity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER TABLE public.knowledge_facts
  ADD COLUMN IF NOT EXISTS knowledge_entity_id uuid REFERENCES public.knowledge_entities(id) ON DELETE SET NULL;

ALTER TABLE public.knowledge_notes
  ADD COLUMN IF NOT EXISTS knowledge_entity_id uuid REFERENCES public.knowledge_entities(id) ON DELETE SET NULL;

ALTER TABLE public.knowledge_links
  ADD COLUMN IF NOT EXISTS source_entity_ref_id uuid REFERENCES public.knowledge_entities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_entity_ref_id uuid REFERENCES public.knowledge_entities(id) ON DELETE SET NULL;

ALTER TABLE public.laura_active_contexts
  ADD COLUMN IF NOT EXISTS active_entity_ref_id uuid REFERENCES public.knowledge_entities(id) ON DELETE SET NULL;

ALTER TABLE public.knowledge_fact_versions
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.ai_memory_events
  ADD COLUMN IF NOT EXISTS related_entity_ref_id uuid REFERENCES public.knowledge_entities(id) ON DELETE SET NULL;

INSERT INTO public.knowledge_entities (
  entity_type,
  entity_id,
  label,
  source_table,
  source_id,
  emenda_id,
  metadata
)
SELECT DISTINCT
  f.entity_type,
  f.entity_id,
  f.entity_id,
  f.source_table,
  f.source_id,
  CASE WHEN f.source_table = 'emendas' THEN public.laura_try_uuid(f.source_id) ELSE NULL END,
  jsonb_build_object('backfilled_from', 'knowledge_facts')
FROM public.knowledge_facts f
WHERE f.entity_type IS NOT NULL
  AND f.entity_id IS NOT NULL
  AND length(trim(f.entity_id)) > 0
ON CONFLICT (entity_type, entity_id) DO UPDATE
SET source_table = COALESCE(EXCLUDED.source_table, public.knowledge_entities.source_table),
    source_id = COALESCE(EXCLUDED.source_id, public.knowledge_entities.source_id),
    emenda_id = COALESCE(EXCLUDED.emenda_id, public.knowledge_entities.emenda_id),
    metadata = public.knowledge_entities.metadata || EXCLUDED.metadata,
    updated_at = now();

INSERT INTO public.knowledge_entities (
  entity_type,
  entity_id,
  label,
  source_table,
  source_id,
  metadata
)
SELECT DISTINCT
  n.entity_type,
  n.entity_id,
  COALESCE(NULLIF(n.title, ''), n.entity_id),
  n.source_table,
  n.source_id,
  jsonb_build_object('backfilled_from', 'knowledge_notes')
FROM public.knowledge_notes n
WHERE n.entity_type IS NOT NULL
  AND n.entity_id IS NOT NULL
  AND length(trim(n.entity_id)) > 0
ON CONFLICT (entity_type, entity_id) DO UPDATE
SET label = COALESCE(EXCLUDED.label, public.knowledge_entities.label),
    source_table = COALESCE(EXCLUDED.source_table, public.knowledge_entities.source_table),
    source_id = COALESCE(EXCLUDED.source_id, public.knowledge_entities.source_id),
    metadata = public.knowledge_entities.metadata || EXCLUDED.metadata,
    updated_at = now();

UPDATE public.knowledge_facts f
SET knowledge_entity_id = e.id
FROM public.knowledge_entities e
WHERE f.knowledge_entity_id IS NULL
  AND e.entity_type = f.entity_type
  AND e.entity_id = f.entity_id;

UPDATE public.knowledge_notes n
SET knowledge_entity_id = e.id
FROM public.knowledge_entities e
WHERE n.knowledge_entity_id IS NULL
  AND e.entity_type = n.entity_type
  AND e.entity_id = n.entity_id;

UPDATE public.knowledge_links l
SET source_entity_ref_id = e.id
FROM public.knowledge_entities e
WHERE l.source_entity_ref_id IS NULL
  AND e.entity_type = l.source_type
  AND e.entity_id = l.source_id;

UPDATE public.knowledge_links l
SET target_entity_ref_id = e.id
FROM public.knowledge_entities e
WHERE l.target_entity_ref_id IS NULL
  AND e.entity_type = l.target_type
  AND e.entity_id = l.target_id;

UPDATE public.ai_memory_events ev
SET related_entity_ref_id = e.id
FROM public.knowledge_entities e
WHERE ev.related_entity_ref_id IS NULL
  AND ev.related_entity_type IS NOT NULL
  AND ev.related_entity_id IS NOT NULL
  AND e.entity_type = ev.related_entity_type
  AND e.entity_id = ev.related_entity_id;

CREATE OR REPLACE FUNCTION public.laura_attach_knowledge_entity()
RETURNS trigger AS $$
BEGIN
  IF NEW.entity_type IS NOT NULL AND NEW.entity_id IS NOT NULL THEN
    NEW.knowledge_entity_id := public.laura_upsert_knowledge_entity(
      NEW.entity_type,
      NEW.entity_id,
      COALESCE(NULLIF(NEW.entity_id, ''), NULL),
      NEW.source_table,
      NEW.source_id,
      jsonb_build_object('attached_by', TG_TABLE_NAME)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS attach_knowledge_fact_entity ON public.knowledge_facts;
CREATE TRIGGER attach_knowledge_fact_entity
  BEFORE INSERT OR UPDATE OF entity_type, entity_id, source_table, source_id ON public.knowledge_facts
  FOR EACH ROW EXECUTE FUNCTION public.laura_attach_knowledge_entity();

DROP TRIGGER IF EXISTS attach_knowledge_note_entity ON public.knowledge_notes;
CREATE TRIGGER attach_knowledge_note_entity
  BEFORE INSERT OR UPDATE OF entity_type, entity_id, source_table, source_id ON public.knowledge_notes
  FOR EACH ROW EXECUTE FUNCTION public.laura_attach_knowledge_entity();

CREATE OR REPLACE FUNCTION public.laura_attach_link_entities()
RETURNS trigger AS $$
BEGIN
  IF NEW.source_type IS NOT NULL AND NEW.source_id IS NOT NULL THEN
    NEW.source_entity_ref_id := public.laura_upsert_knowledge_entity(
      NEW.source_type,
      NEW.source_id,
      NEW.source_id,
      NEW.source_table,
      NEW.source_record_id,
      jsonb_build_object('attached_by', 'knowledge_links_source')
    );
  END IF;

  IF NEW.target_type IS NOT NULL AND NEW.target_id IS NOT NULL THEN
    NEW.target_entity_ref_id := public.laura_upsert_knowledge_entity(
      NEW.target_type,
      NEW.target_id,
      NEW.target_id,
      NULL,
      NULL,
      jsonb_build_object('attached_by', 'knowledge_links_target')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS attach_knowledge_link_entities ON public.knowledge_links;
CREATE TRIGGER attach_knowledge_link_entities
  BEFORE INSERT OR UPDATE OF source_type, source_id, target_type, target_id, source_table, source_record_id ON public.knowledge_links
  FOR EACH ROW EXECUTE FUNCTION public.laura_attach_link_entities();

CREATE OR REPLACE FUNCTION public.laura_attach_active_context_entity()
RETURNS trigger AS $$
DECLARE
  v_type text;
  v_id text;
BEGIN
  v_type := NULLIF(NEW.active_entity_type, '');
  v_id := NULLIF(NEW.active_entity_id, '');

  IF v_type IS NOT NULL AND v_id IS NOT NULL THEN
    NEW.active_entity_ref_id := public.laura_upsert_knowledge_entity(
      v_type,
      v_id,
      NEW.active_entity_label,
      NULL,
      NULL,
      jsonb_build_object('attached_by', 'laura_active_contexts')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS attach_laura_active_context_entity ON public.laura_active_contexts;
CREATE TRIGGER attach_laura_active_context_entity
  BEFORE INSERT OR UPDATE OF active_entity_type, active_entity_id, active_entity_label ON public.laura_active_contexts
  FOR EACH ROW EXECUTE FUNCTION public.laura_attach_active_context_entity();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chat_sessions_id_user_unique'
      AND conrelid = 'public.chat_sessions'::regclass
  ) THEN
    ALTER TABLE public.chat_sessions
      ADD CONSTRAINT chat_sessions_id_user_unique UNIQUE (id, user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chat_messages_session_user_fkey'
      AND conrelid = 'public.chat_messages'::regclass
  ) THEN
    ALTER TABLE public.chat_messages
      ADD CONSTRAINT chat_messages_session_user_fkey
      FOREIGN KEY (session_id, user_id)
      REFERENCES public.chat_sessions(id, user_id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'knowledge_facts_entity_nonempty'
      AND conrelid = 'public.knowledge_facts'::regclass
  ) THEN
    ALTER TABLE public.knowledge_facts
      ADD CONSTRAINT knowledge_facts_entity_nonempty
      CHECK (
        length(trim(entity_type)) > 0
        AND length(trim(entity_id)) > 0
        AND length(trim(fact_key)) > 0
      )
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'knowledge_notes_entity_pair_consistent'
      AND conrelid = 'public.knowledge_notes'::regclass
  ) THEN
    ALTER TABLE public.knowledge_notes
      ADD CONSTRAINT knowledge_notes_entity_pair_consistent
      CHECK (
        (entity_type IS NULL AND entity_id IS NULL)
        OR (entity_type IS NOT NULL AND entity_id IS NOT NULL AND length(trim(entity_type)) > 0 AND length(trim(entity_id)) > 0)
      )
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'knowledge_links_no_self_relation'
      AND conrelid = 'public.knowledge_links'::regclass
  ) THEN
    ALTER TABLE public.knowledge_links
      ADD CONSTRAINT knowledge_links_no_self_relation
      CHECK (
        NOT (
          source_type = target_type
          AND source_id = target_id
          AND relation_type IN ('substitui', 'corrige', 'origina')
        )
      )
      NOT VALID;
  END IF;
END $$;

ALTER TABLE public.knowledge_facts VALIDATE CONSTRAINT knowledge_facts_entity_nonempty;
ALTER TABLE public.knowledge_notes VALIDATE CONSTRAINT knowledge_notes_entity_pair_consistent;
ALTER TABLE public.knowledge_links VALIDATE CONSTRAINT knowledge_links_no_self_relation;

CREATE INDEX IF NOT EXISTS idx_knowledge_facts_entity_ref
  ON public.knowledge_facts(knowledge_entity_id)
  WHERE knowledge_entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_notes_entity_ref
  ON public.knowledge_notes(knowledge_entity_id)
  WHERE knowledge_entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_notes_learning
  ON public.knowledge_notes(created_by, status, updated_at DESC)
  WHERE metadata->>'kind' = 'learning';

CREATE INDEX IF NOT EXISTS idx_knowledge_notes_metadata_kind
  ON public.knowledge_notes((metadata->>'kind'));

CREATE INDEX IF NOT EXISTS idx_knowledge_links_source_entity_ref
  ON public.knowledge_links(source_entity_ref_id)
  WHERE source_entity_ref_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_links_target_entity_ref
  ON public.knowledge_links(target_entity_ref_id)
  WHERE target_entity_ref_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated
  ON public.chat_sessions(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_role_created
  ON public.chat_messages(session_id, role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_memory_events_related_entity_ref
  ON public.ai_memory_events(related_entity_ref_id)
  WHERE related_entity_ref_id IS NOT NULL;

CREATE OR REPLACE VIEW public.laura_learning_memory AS
SELECT
  n.id,
  n.created_by AS user_id,
  n.content,
  n.status,
  n.confidence,
  n.metadata->>'learning_type' AS learning_type,
  n.metadata->>'reason' AS reason,
  n.created_by_ai,
  n.created_at,
  n.updated_at
FROM public.knowledge_notes n
WHERE n.metadata->>'kind' = 'learning';

GRANT SELECT ON public.knowledge_entities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.knowledge_entities TO authenticated;
GRANT SELECT ON public.laura_learning_memory TO authenticated;
GRANT EXECUTE ON FUNCTION public.laura_upsert_knowledge_entity(text, text, text, text, text, jsonb) TO authenticated;

DROP POLICY IF EXISTS "Knowledge entities read authenticated" ON public.knowledge_entities;
CREATE POLICY "Knowledge entities read authenticated"
ON public.knowledge_entities FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Knowledge entities manage technical roles" ON public.knowledge_entities;
CREATE POLICY "Knowledge entities manage technical roles"
ON public.knowledge_entities FOR ALL TO authenticated
USING (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'))
WITH CHECK (public.get_user_role() IN ('ADMIN', 'GESTOR', 'ANALISTA'));
