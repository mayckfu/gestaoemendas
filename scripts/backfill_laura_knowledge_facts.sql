DO $$
DECLARE
  r record;
  v_entity_type text;
  v_entity_id text;
BEGIN
  FOR r IN
    SELECT
      id,
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
    FROM public.emendas
  LOOP
    v_entity_type := CASE
      WHEN NULLIF(r.numero_proposta, '') IS NOT NULL THEN 'proposta'
      ELSE 'emenda'
    END;

    v_entity_id := COALESCE(
      NULLIF(r.numero_proposta, ''),
      NULLIF(r.numero_emenda, ''),
      r.id::text
    );

    PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'id', r.id::text, 'emendas', r.id::text);
    PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'numero_proposta', r.numero_proposta, 'emendas', r.id::text);
    PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'numero_emenda', r.numero_emenda, 'emendas', r.id::text);
    PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'valor_total', r.valor_total::text, 'emendas', r.id::text);
    PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'valor_repasse', r.valor_repasse::text, 'emendas', r.id::text);
    PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'objeto', r.objeto_emenda, 'emendas', r.id::text);
    PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'parlamentar', r.parlamentar, 'emendas', r.id::text);
    PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'autor', r.autor, 'emendas', r.id::text);
    PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'situacao', r.situacao::text, 'emendas', r.id::text);
    PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'status_interno', r.status_interno::text, 'emendas', r.id::text);
    PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'tipo', r.tipo::text, 'emendas', r.id::text);
    PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'tipo_recurso', r.tipo_recurso::text, 'emendas', r.id::text);
    PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'destino_recurso', r.destino_recurso, 'emendas', r.id::text);
    PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'portaria', r.portaria, 'emendas', r.id::text);
    PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'data_repasse', r.data_repasse::text, 'emendas', r.id::text);
    PERFORM public.laura_set_official_fact(v_entity_type, v_entity_id, 'situacao_recurso', r.situacao_recurso, 'emendas', r.id::text);
  END LOOP;
END $$;

SELECT
  count(*) AS total_knowledge_facts,
  count(DISTINCT entity_type || ':' || entity_id) AS total_entities
FROM public.knowledge_facts
WHERE source_table = 'emendas';
