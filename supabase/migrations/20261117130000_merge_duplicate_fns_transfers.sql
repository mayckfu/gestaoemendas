-- Consolidate legacy INVESTSUS transfers with the official FNS transfer when
-- both represent the same single payment and caused the amendment total to be
-- counted twice. Every affected amendment already has an automatic FNS backup.
WITH duplicate_pairs AS (
  SELECT
    e.id AS emenda_id,
    (array_agg(r.id) FILTER (WHERE r.fonte = 'INVESTSUS'))[1] AS legacy_id,
    (array_agg(r.id) FILTER (WHERE r.fonte = 'FNS'))[1] AS official_id
  FROM public.emendas e
  JOIN public.repasses r ON r.emenda_id = e.id AND r.status = 'REPASSADO'
  WHERE e.ano_exercicio = 2025
  GROUP BY e.id, e.valor_total
  HAVING count(*) = 2
     AND count(*) FILTER (WHERE r.fonte = 'INVESTSUS') = 1
     AND count(*) FILTER (WHERE r.fonte = 'FNS') = 1
     AND sum(r.valor) > e.valor_total
     AND min(r.valor) = max(r.valor)
), merged AS (
  UPDATE public.repasses legacy
  SET
    data = official.data,
    valor = official.valor,
    fonte = 'FNS',
    status = official.status,
    observacoes = official.observacoes,
    ordem_bancaria = official.ordem_bancaria,
    bank_code = official.bank_code,
    bank_name = official.bank_name,
    branch_number = official.branch_number,
    account_number = official.account_number,
    banking_verified_at = official.banking_verified_at,
    fns_payment_data = official.fns_payment_data
  FROM duplicate_pairs pairs
  JOIN public.repasses official ON official.id = pairs.official_id
  WHERE legacy.id = pairs.legacy_id
  RETURNING pairs.official_id
)
DELETE FROM public.repasses
WHERE id IN (SELECT official_id FROM merged);
