INSERT INTO public.knowledge_notes (
  title,
  content,
  note_type,
  source_type,
  entity_type,
  entity_id,
  source_table,
  source_id,
  created_by_ai,
  status,
  confidence,
  metadata
)
VALUES (
  'Aprendizado da Laura: UOM',
  'UOM e uma forma abreviada usada pelo usuario para se referir a Unidade Odontologica Movel. No banco oficial, a proposta relacionada tem objeto AQUISICAO DE UNIDADE ODONTOLOGICA MOVEL.',
  'nota_tecnica',
  'inferencia_ia',
  'proposta',
  '11447284000125019',
  'emendas',
  '08c56ad9-1fc0-4132-a7b6-45c018cd23dd',
  true,
  'pendente_confirmacao',
  0.85,
  jsonb_build_object(
    'kind', 'learning',
    'learning_type', 'synonym',
    'term', 'UOM',
    'canonical_term', 'Unidade Odontologica Movel',
    'reason', 'Usuario perguntou por UOM ou unidade movel odontologica e a Laura localizou a proposta correta.',
    'created_from', 'chat_review'
  )
)
RETURNING
  id,
  title,
  status,
  confidence,
  knowledge_entity_id,
  metadata->>'learning_type' AS learning_type;
