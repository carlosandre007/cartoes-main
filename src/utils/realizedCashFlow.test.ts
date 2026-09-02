import assert from 'node:assert/strict';
import test from 'node:test';
import { Transaction } from '../types';
import { AUREUM_FLOW_COST_CENTER, buildRealizedCashFlow, createAutomaticFlowTransaction, summarizeRealizedCashFlow } from './realizedCashFlow';

const base = (partial: Partial<Transaction> & Pick<Transaction, 'id' | 'tipo' | 'valor'>): Transaction => ({
  descricao: partial.id, data: '2026-09-10', categoria: 'Outros', empresa: 'Pessoal',
  centroCusto: 'Outra área', formaPagamento: 'PIX', origemFinanceira: 'OUTRO', status: 'PAGO', ...partial,
});

test('abre zerado mesmo com lançamentos, custos fixos e cartões antigos', () => {
  const legacy = [
    base({ id: 'old', tipo: 'RECEITA', valor: 200 }),
    base({ id: 'fixed', tipo: 'DESPESA', valor: 100, origemFinanceira: 'CUSTO_FIXO', custoFixoDetalhes: { recorrencia: 'MENSAL', proximoVencimento: '2026-08-10', ativo: true, dataPagamento: '2026-08-10' } }),
    base({ id: 'card', tipo: 'DESPESA', valor: 50, origemFinanceira: 'CARTAO_CREDITO', cartaoDetalhes: { cartaoId: 'c1', cartaoNome: 'Card', pagamentoFaturaId: 'old-payment', dataPagamentoFatura: '2026-08-10' } }),
  ];
  assert.deepEqual(buildRealizedCashFlow(legacy), []);
});

test('lançamento manual próprio funciona', () => {
  const manual = base({ id: 'manual', tipo: 'RECEITA', valor: 200, centroCusto: AUREUM_FLOW_COST_CENTER, empresa: 'Aureum' });
  assert.equal(buildRealizedCashFlow([manual])[0].empresa, 'Aureum');
  assert.deepEqual(summarizeRealizedCashFlow(buildRealizedCashFlow([manual])), { entradas: 200, saidas: 0, resultado: 200 });
});

test('pagamentos confirmados de custo e fatura entram com origem e referência', () => {
  const source = base({ id: 'source', tipo: 'DESPESA', valor: 100, empresa: 'Empresa A' });
  const fixed = createAutomaticFlowTransaction('CUSTO_FIXO', source.id, source, '2026-09-11');
  const card = createAutomaticFlowTransaction('PAGAMENTO_CARTAO', 'card-2026-09-Empresa A', { ...source, valor: 50 }, '2026-09-12');
  const items = buildRealizedCashFlow([fixed, card]);
  assert.deepEqual(items.map((item) => item.origem).sort(), ['CUSTO_FIXO', 'PAGAMENTO_CARTAO']);
  assert.deepEqual(summarizeRealizedCashFlow(items), { entradas: 0, saidas: 150, resultado: -150 });
});

test('a mesma confirmação não duplica e empresas geram referências separadas', () => {
  const a = base({ id: 'a', tipo: 'DESPESA', valor: 10, empresa: 'Empresa A' });
  const b = base({ id: 'b', tipo: 'DESPESA', valor: 20, empresa: 'Empresa B' });
  const flowA = createAutomaticFlowTransaction('PAGAMENTO_CARTAO', 'card-month-Empresa A', a, '2026-09-12');
  const sameA = createAutomaticFlowTransaction('PAGAMENTO_CARTAO', 'card-month-Empresa A', a, '2026-09-12');
  const flowB = createAutomaticFlowTransaction('PAGAMENTO_CARTAO', 'card-month-Empresa B', b, '2026-09-12');
  assert.equal(flowA.id, sameA.id);
  assert.equal(buildRealizedCashFlow([flowA, sameA, flowB]).length, 2);
  assert.notEqual(flowA.id, flowB.id);
});
