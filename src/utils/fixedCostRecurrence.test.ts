import assert from 'node:assert/strict';
import test from 'node:test';
import { Transaction } from '../types';
import { createNextFixedCostOccurrences } from './fixedCostRecurrence';

const fixedCost = (data: string, status: Transaction['status'], id = `fixed-cost-${data}`): Transaction => ({
  id,
  tipo: 'DESPESA',
  descricao: 'Aluguel',
  valor: 1500,
  data,
  categoria: 'Moradia',
  empresa: 'Pessoal',
  centroCusto: 'Custos Fixos',
  formaPagamento: 'PIX',
  origemFinanceira: 'CUSTO_FIXO',
  status,
  custoFixoDetalhes: {
    recorrencia: 'MENSAL',
    recorrenciaId: 'fixed-rent',
    proximoVencimento: data,
    ativo: true,
  },
});

test('custo pendente não cria setembro, outubro ou qualquer competência futura', () => {
  const august = fixedCost('2026-08-10', 'PENDENTE');
  assert.deepEqual(createNextFixedCostOccurrences([], [august]), []);
});

test('pagar agosto cria somente setembro pendente', () => {
  const august = fixedCost('2026-08-10', 'PAGO');
  const created = createNextFixedCostOccurrences([august], [august]);

  assert.equal(created.length, 1);
  assert.equal(created[0].data, '2026-09-10');
  assert.equal(created[0].status, 'PENDENTE');
  assert.equal(created.some((tx) => tx.data.startsWith('2026-10')), false);
});

test('abrir outro mês ou recarregar não cria lançamentos', () => {
  const august = fixedCost('2026-08-10', 'PAGO');
  const september = fixedCost('2026-09-10', 'PENDENTE', 'fixed-rent-2026-09-10');
  const persisted = [august, september];

  assert.deepEqual(createNextFixedCostOccurrences([], persisted), []);
  assert.deepEqual(createNextFixedCostOccurrences([], [...persisted]), []);
});

test('reprocessar o pagamento de agosto não duplica setembro nem cria outubro', () => {
  const august = fixedCost('2026-08-10', 'PAGO');
  const september = fixedCost('2026-09-10', 'PENDENTE', 'fixed-rent-2026-09-10');
  assert.deepEqual(createNextFixedCostOccurrences([august], [august, september]), []);
});

test('pagar setembro cria somente outubro e nunca novembro', () => {
  const august = fixedCost('2026-08-10', 'PAGO');
  const september = fixedCost('2026-09-10', 'PAGO', 'fixed-rent-2026-09-10');
  const created = createNextFixedCostOccurrences([september], [august, september]);

  assert.equal(created.length, 1);
  assert.equal(created[0].data, '2026-10-10');
  assert.equal(created[0].status, 'PENDENTE');
  assert.equal(created.some((tx) => tx.data.startsWith('2026-11')), false);
});

test('após o último mês pago existe no máximo uma competência futura pendente', () => {
  const september = fixedCost('2026-09-10', 'PAGO', 'fixed-rent-2026-09-10');
  const created = createNextFixedCostOccurrences([september], [september]);
  const futurePending = created.filter((tx) => tx.status === 'PENDENTE' && tx.data > september.data);

  assert.equal(futurePending.length, 1);
  assert.equal(futurePending[0].data.slice(0, 7), '2026-10');
});
