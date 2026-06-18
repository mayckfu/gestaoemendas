-- Add valor_total matching to the global emendas search.
-- Supports Brazilian currency input such as "1.300.000,00" and plain digits.
CREATE OR REPLACE FUNCTION search_emendas_global(search_term text)
RETURNS SETOF emendas
LANGUAGE sql
STABLE
AS $$
  WITH normalized AS (
    SELECT
      COALESCE(search_term, '') AS term,
      REGEXP_REPLACE(COALESCE(search_term, ''), '\D', '', 'g') AS term_digits
  )
  SELECT e.*
  FROM emendas e
  CROSS JOIN normalized n
  WHERE
    e.parlamentar ILIKE '%' || n.term || '%' OR
    e.autor ILIKE '%' || n.term || '%' OR
    e.numero_emenda ILIKE '%' || n.term || '%' OR
    e.numero_proposta ILIKE '%' || n.term || '%' OR
    e.objeto_emenda ILIKE '%' || n.term || '%' OR
    e.natureza ILIKE '%' || n.term || '%' OR
    e.situacao::text ILIKE '%' || n.term || '%' OR
    e.status_interno::text ILIKE '%' || n.term || '%' OR
    -- Portaria search: ignore dots in both the column and the search term.
    REPLACE(COALESCE(e.portaria, ''), '.', '') ILIKE '%' || REPLACE(n.term, '.', '') || '%' OR
    (
      n.term_digits <> '' AND
      (
        -- Whole amount, e.g. 1300000.
        REGEXP_REPLACE(TO_CHAR(e.valor_total, 'FM9999999999999999990'), '\D', '', 'g')
          ILIKE '%' || n.term_digits || '%' OR
        -- Amount in cents, e.g. 1.300.000,00 -> 130000000.
        REGEXP_REPLACE(TO_CHAR(e.valor_total * 100, 'FM9999999999999999990'), '\D', '', 'g')
          ILIKE '%' || n.term_digits || '%'
      )
    )
  LIMIT 20;
$$;
