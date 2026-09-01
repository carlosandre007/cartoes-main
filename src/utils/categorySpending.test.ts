import assert from 'node:assert/strict';
import test from 'node:test';
import { CreditCard, Transaction } from '../types';
import { getMonthlyCategorySpending } from './categorySpending';
import { getConsolidatedFlowItems } from './financialCalculations';

const card: CreditCard = { id: 'card', nome: 'Cartão', bandeira: 'VISA', finalCartao: '1234', limiteTotal: 1000, limiteUtilizado: 0, fechamentoDia: 10, vencimentoDia: 20, corGradiente: '#000', categoriaCard: 'AUREUM BLACK' };
const expense = (id: string, valor: number, categoria: string, data = '2026-09-05'): Transaction => ({
  id, tipo: 'DESPESA', descricao: id, valor, data, categoria, empresa: 'Pessoal', centroCusto: 'Pessoal', formaPagamento: 'PIX', origemFinanceira: 'OUTRO', status: 'PAGO',
});

test('agrupa despesas do mês corrente por categoria com valor e percentual', () => {
  const result = getMonthlyCategorySpending([
    expense('mercado', 75, 'Alimentação'), expense('restaurante', 25, 'Alimentação'),
    expense('ônibus', 50, 'Transporte'), expense('outubro', 500, 'Outros', '2026-10-01'),
  ], [], new Date(2026, 8, 1));

  assert.deepEqual(result, [
    { category: 'Alimentação', amount: 100, percentage: 100 / 150 * 100 },
    { category: 'Transporte', amount: 50, percentage: 50 / 150 * 100 },
  ]);
});

test('usa a competência da fatura para categorizar compras no cartão sem duplicar a fatura', () => {
  const purchase = { ...expense('compra', 30.10, 'Compras', '2026-08-25'), origemFinanceira: 'CARTAO_CREDITO' as const, cartaoDetalhes: { cartaoId: card.id, cartaoNome: card.nome, competenciaFatura: '2026-09' } };
  assert.deepEqual(getMonthlyCategorySpending([purchase], [card], new Date(2026, 8, 1)), [
    { category: 'Compras', amount: 30.1, percentage: 100 },
  ]);
});

test('total das categorias é igual ao fluxo consolidado quando a fatura tem abatimentos', () => {
  const cardExpense = (id: string, valor: number, categoria: string, status: Transaction['status']): Transaction => ({
    ...expense(id, valor, categoria, '2026-08-25'), status, origemFinanceira: 'CARTAO_CREDITO',
    cartaoDetalhes: { cartaoId: card.id, cartaoNome: card.nome, competenciaFatura: '2026-09' },
  });
  const transactions = [
    expense('aluguel', 500, 'Moradia'),
    cardExpense('pago', 113.27, 'Serviços', 'PAGO'),
    cardExpense('aberto-a', 600, 'BIA', 'PENDENTE'),
    cardExpense('aberto-b', 475.82, 'IMPRESS 3D', 'AGENDADO'),
  ];
  const categoriesTotal = getMonthlyCategorySpending(transactions, [card], new Date(2026, 8, 1))
    .reduce((sum, item) => sum + item.amount, 0);
  const consolidatedTotal = getConsolidatedFlowItems(transactions, [card])
    .filter((item) => item.tipo === 'DESPESA' && item.data.startsWith('2026-09'))
    .reduce((sum, item) => sum + item.valor, 0);

  assert.equal(categoriesTotal, 1575.82);
  assert.equal(categoriesTotal, consolidatedTotal);
});
