-- Limpeza de custos fixos registrados incorretamente a partir de outubro/2026.
-- Escopo: somente public.transactions com origem_financeira = 'CUSTO_FIXO'.
-- Não altera a lógica de recorrência nem registros de outros módulos.

BEGIN;

-- 1. Relação exata dos registros que serão excluídos.
SELECT
  id,
  descricao,
  data AS competencia,
  valor,
  status,
  custo_fixo_detalhes
FROM public.transactions
WHERE origem_financeira = 'CUSTO_FIXO'
  AND data >= '2026-10-01'
ORDER BY data, descricao, id;

-- 2. Exclusão limitada aos custos fixos a partir de outubro/2026.
WITH removidos AS (
  DELETE FROM public.transactions
  WHERE origem_financeira = 'CUSTO_FIXO'
    AND data >= '2026-10-01'
  RETURNING id, descricao, data, valor, status
)
SELECT
  COUNT(*) AS quantidade_excluida,
  COALESCE(SUM(valor), 0) AS valor_total_excluido
FROM removidos;

-- 3. Confirma que nenhum registro dentro do recorte permaneceu.
SELECT COUNT(*) AS custos_fixos_restantes_a_partir_de_outubro_2026
FROM public.transactions
WHERE origem_financeira = 'CUSTO_FIXO'
  AND data >= '2026-10-01';

COMMIT;
