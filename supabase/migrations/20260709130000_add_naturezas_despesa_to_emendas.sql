alter table public.emendas
add column if not exists naturezas_despesa jsonb not null default '[]'::jsonb;

update public.emendas
set naturezas_despesa = jsonb_build_array(
  jsonb_build_object('natureza', natureza, 'valor', valor_total)
)
where natureza is not null
  and trim(natureza) <> ''
  and naturezas_despesa = '[]'::jsonb;
