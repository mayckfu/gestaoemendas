-- Create a search function to handle format-agnostic searching for Portaria
-- and general search across other fields
CREATE OR REPLACE FUNCTION search_emendas_global(search_term text)
RETURNS SETOF emendas
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM emendas
  WHERE
    parlamentar ILIKE '%' || search_term || '%' OR
    autor ILIKE '%' || search_term || '%' OR
    numero_emenda ILIKE '%' || search_term || '%' OR
    numero_proposta ILIKE '%' || search_term || '%' OR
    objeto_emenda ILIKE '%' || search_term || '%' OR
    natureza ILIKE '%' || search_term || '%' OR
    situacao::text ILIKE '%' || search_term || '%' OR
    status_interno::text ILIKE '%' || search_term || '%' OR
    -- Portaria search: ignore dots in both the column and the search term
    REPLACE(COALESCE(portaria, ''), '.', '') ILIKE '%' || REPLACE(search_term, '.', '') || '%'
  LIMIT 20;
$$;
