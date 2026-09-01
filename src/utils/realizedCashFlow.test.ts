import assert from 'node:assert/strict';
import test from 'node:test';
import { CreditCard, Transaction } from '../types';
import { buildRealizedCashFlow, filterRealizedCashFlow, summarizeRealizedCashFlow } from './realizedCashFlow';

const card: CreditCard = { id: 'card', nome: 'Cartão Teste', bandeira: 'VISA', finalCartao: '1234', limiteTotal: 1000, limiteUtilizado: 0, fechamentoDia: 10, vencimentoDia: 20, corGradiente: '#000000', categoriaCard: 'AUREUM BLACK' };
const base = (partial: Partial<Transaction> & Pick<Transaction, 'id' | 'tipo' | 'valor'>): Transaction => ({
  descricao: partial.id, data: '2026-09-10', categoria: 'Outros', empresa: 'Pessoal',
  centroCusto: 'Fluxo pessoal', formaPagamento: 'PIX', origemFinanceira: 'OUTRO', status: 'PAGO',
  ...partial,
});

const scenario: Transaction[] = [
  base({ id: 'income', tipo: 'RECEITA', valor: 200 }),
  base({ id: 'expense', tipo: 'DESPESA', valor: 30 }),
  base({ id: 'fixed', tipo: 'DESPESA', valor: 100, data: '2026-08-15', centroCusto: 'Custos Fixos', origemFinanceira: 'CUSTO_FIXO', custoFixoDetalhes: { recorrencia: 'MENSAL', proximoVencimento: '2026-08-15', ativo: true, dataPagamento: '2026-09-11', valorPago: 100 } }),
  base({ id: 'card-purchase', tipo: 'DESPESA', valor: 50, data: '2026-08-01', centroCusto: 'Cartão', origemFinanceira: 'CARTAO_CREDITO', cartaoDetalhes: { cartaoId: card.id, cartaoNome: card.nome, competenciaFatura: '2026-08', pagamentoFaturaId: 'payment-1', dataPagamentoFatura: '2026-09-12' } }),
];

test('200 recebidos - 30 pagos - 100 custo pago - 50 fatura paga = 20', () => {
  const items = buildRealizedCashFlow(scenario, [card]);
  assert.equal(items.length, 4);
  assert.deepEqual(summarizeRealizedCashFlow(items), { entradas: 200, saidas: 180, resultado: 20 });
});

test('pendências, previsões e compras no cartão sem pagamento não entram', () => {
  const excluded = [
    base({ id: 'pending-expense', tipo: 'DESPESA', valor: 30, status: 'PENDENTE' }),
    base({ id: 'forecast-income', tipo: 'RECEITA', valor: 200, status: 'AGENDADO' }),
    base({ id: 'unpaid-card', tipo: 'DESPESA', valor: 300, origemFinanceira: 'CARTAO_CREDITO', cartaoDetalhes: { cartaoId: card.id, cartaoNome: card.nome, competenciaFatura: '2026-09' }, status: 'PENDENTE' }),
    base({ id: 'legacy-fixed-without-safe-date', tipo: 'DESPESA', valor: 100, origemFinanceira: 'CUSTO_FIXO', centroCusto: 'Custos Fixos', custoFixoDetalhes: { recorrencia: 'MENSAL', proximoVencimento: '2026-08-01', ativo: true } }),
  ];
  assert.deepEqual(buildRealizedCashFlow(excluded, [card]), []);
});

test('usa a data efetiva e somente o valor de pagamento parcial informado', () => {
  const partial = base({ id: 'partial', tipo: 'DESPESA', valor: 100, data: '2026-08-20', origemFinanceira: 'CUSTO_FIXO', centroCusto: 'Custos Fixos', custoFixoDetalhes: { recorrencia: 'MENSAL', proximoVencimento: '2026-08-20', ativo: true, dataPagamento: '2026-09-03', valorPago: 40 } });
  const [item] = buildRealizedCashFlow([partial], [card]);
  assert.equal(item.dataEfetiva, '2026-09-03');
  assert.equal(item.valor, 40);
});

test('repetir carregamento/salvamento pelo mesmo id não duplica o fluxo', () => {
  const duplicate = { ...scenario[0] };
  assert.equal(buildRealizedCashFlow([scenario[0], duplicate], [card]).length, 1);
});

test('edição, exclusão e desfazimento reconciliam a projeção', () => {
  const edited = scenario.map((tx) => tx.id === 'expense' ? { ...tx, valor: 35 } : tx);
  assert.equal(summarizeRealizedCashFlow(buildRealizedCashFlow(edited, [card])).resultado, 15);
  assert.equal(buildRealizedCashFlow(scenario.filter((tx) => tx.id !== 'expense'), [card]).length, 3);
  const reversed = scenario.map((tx) => tx.id === 'fixed' ? { ...tx, status: 'PENDENTE' as const } : tx);
  assert.equal(buildRealizedCashFlow(reversed, [card]).some((item) => item.origem === 'CUSTO_FIXO'), false);
});

test('filtros controlam os totais sobre todos os registros, independentemente da página', () => {
  const items = buildRealizedCashFlow(scenario, [card]);
  const septemberExpenses = filterRealizedCashFlow(items, { startDate: '2026-09-01', endDate: '2026-09-30', tipo: 'DESPESA', origem: 'TODAS' });
  assert.equal(septemberExpenses.length, 3);
  assert.deepEqual(summarizeRealizedCashFlow(septemberExpenses), { entradas: 0, saidas: 180, resultado: -180 });
});

test('somas monetárias mantêm precisão de centavos', () => {
  const items = buildRealizedCashFlow([base({ id: 'a', tipo: 'RECEITA', valor: 0.1 }), base({ id: 'b', tipo: 'RECEITA', valor: 0.2 })], [card]);
  assert.equal(summarizeRealizedCashFlow(items).entradas, 0.3);
});
