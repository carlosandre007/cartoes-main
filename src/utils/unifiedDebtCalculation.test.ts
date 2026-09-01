import assert from 'node:assert/strict';
import test from 'node:test';
import { CreditCard, CreditContract, Transaction } from '../types';
import { calculateUnifiedDebt, getTotalFinancingDebt, getTotalFixedCostDebt, getTotalOpenCardDebt } from './financialCalculations';

const card = (id: string): CreditCard => ({ id, nome: id, bandeira: 'VISA', finalCartao: '1234', limiteTotal: 10000, limiteUtilizado: 0, fechamentoDia: 10, vencimentoDia: 20, corGradiente: '#000', categoriaCard: 'AUREUM BLACK' });
const purchase = (id: string, cardId: string, value: number, status: Transaction['status'], competence = '2026-09'): Transaction => ({
  id, tipo: 'DESPESA', descricao: id, valor: value, data: '2026-08-25', categoria: 'Compras', empresa: 'Pessoal', centroCusto: 'Cartão', formaPagamento: 'Cartão de Crédito', origemFinanceira: 'CARTAO_CREDITO', status,
  cartaoDetalhes: { cartaoId: cardId, cartaoNome: cardId, competenciaFatura: competence },
});
const fixed = (id: string, value: number, status: Transaction['status']): Transaction => ({
  id, tipo: 'DESPESA', descricao: id, valor: value, data: '2026-09-10', categoria: 'Casa', empresa: 'Pessoal', centroCusto: 'Custos Fixos', formaPagamento: 'PIX', origemFinanceira: 'CUSTO_FIXO', status,
  custoFixoDetalhes: { recorrencia: 'UNICA', proximoVencimento: '2026-09-10', ativo: true },
});
const contract = (id: string, remaining: number, status: CreditContract['status'] = 'EM_DIA'): CreditContract => ({
  id, titulo: id, tipo: 'FINANCIAMENTO', instituicao: 'Banco', valorTotal: 1000, valorPago: 1000 - remaining, valorRestante: remaining, parcelasTotal: 10, parcelasPagas: 2, valorParcelaMensal: 100, taxaJurosAnual: 0, proximoVencimento: '2026-09-15', categoria: 'Imóveis', status,
});

test('memória reproduz o exemplo de R$ 950 em dívida aberta', () => {
  const cards = [card('A'), card('B')];
  const transactions = [
    purchase('A-pago', 'A', 200, 'PAGO'), purchase('A-aberto', 'A', 800, 'PENDENTE'),
    purchase('B-pago', 'B', 300, 'PAGO'), fixed('C', 150, 'PENDENTE'),
  ];
  const result = calculateUnifiedDebt(transactions, cards, [], new Date(2026, 8, 1));
  assert.equal(result.subtotals.CARTAO, 800);
  assert.equal(result.subtotals.CUSTO_FIXO, 150);
  assert.equal(result.total, 950);
  assert.equal(result.excluded.some((item) => item.description === 'Fatura B' && item.exclusionReason === 'Quitado'), true);
});

test('itens, subtotais, total e funções públicas usam a mesma soma em centavos', () => {
  const cards = [card('A'), card('B')];
  const transactions = [purchase('a', 'A', 0.1, 'PENDENTE'), purchase('b', 'B', 0.2, 'AGENDADO'), fixed('fixo', 10.01, 'PENDENTE')];
  const contracts = [contract('contrato-1', 20.02), contract('contrato-2', 30.03)];
  const result = calculateUnifiedDebt(transactions, cards, contracts, new Date(2026, 8, 1));
  const includedTotal = result.included.reduce((cents, item) => cents + Math.round(item.contribution * 100), 0) / 100;
  assert.equal(result.total, 60.36);
  assert.equal(includedTotal, result.total);
  assert.equal(result.subtotals.CARTAO, getTotalOpenCardDebt(transactions, cards, new Date(2026, 8, 1)));
  assert.equal(result.subtotals.FINANCIAMENTO, getTotalFinancingDebt(transactions, contracts));
  assert.equal(result.subtotals.CUSTO_FIXO, getTotalFixedCostDebt(transactions, new Date(2026, 8, 1)));
});

test('cancelados, outra competência quitada e recorrência futura ficam explicados fora do total', () => {
  const recurring = purchase('rec-futura', 'A', 90, 'PENDENTE', '2026-10');
  recurring.cartaoDetalhes = { ...recurring.cartaoDetalhes!, recorrente: true, recorrenciaId: 'rec' };
  const cancelled = fixed('cancelado', 500, 'CANCELADO');
  const result = calculateUnifiedDebt([recurring, cancelled, purchase('quitada', 'A', 40, 'PAGO', '2026-08')], [card('A')], [], new Date(2026, 8, 1));
  assert.equal(result.total, 0);
  assert.equal(result.excluded.some((item) => item.exclusionReason?.includes('Recorrência futura')), true);
  assert.equal(result.excluded.some((item) => item.exclusionReason === 'Cancelado'), true);
  assert.equal(result.excluded.some((item) => item.exclusionReason === 'Quitado'), true);
});

test('memória não limita a soma à paginação visual e aceita ausência de registros', () => {
  const many = Array.from({ length: 37 }, (_, index) => fixed(`fixo-${index}`, 10, 'PENDENTE'));
  const populated = calculateUnifiedDebt(many, [], [], new Date(2026, 8, 1));
  assert.equal(populated.included.length, 37);
  assert.equal(populated.total, 370);
  const empty = calculateUnifiedDebt([], [], [], new Date(2026, 8, 1));
  assert.deepEqual(empty.subtotals, { CARTAO: 0, FINANCIAMENTO: 0, CUSTO_FIXO: 0 });
  assert.equal(empty.total, 0);
});

test('mudança de competência altera painel e memória juntos', () => {
  const transactions = [purchase('setembro', 'A', 100, 'PENDENTE'), purchase('outubro', 'A', 200, 'PENDENTE', '2026-10')];
  assert.equal(calculateUnifiedDebt(transactions, [card('A')], [], new Date(2026, 8, 1)).subtotals.CARTAO, 300, 'parcelas futuras contratadas integram a dívida aberta');
  const recurring = { ...transactions[1], cartaoDetalhes: { ...transactions[1].cartaoDetalhes!, recorrente: true, recorrenciaId: 'monthly' } };
  assert.equal(calculateUnifiedDebt([transactions[0], recurring], [card('A')], [], new Date(2026, 8, 1)).total, 100);
  assert.equal(calculateUnifiedDebt([transactions[0], recurring], [card('A')], [], new Date(2026, 9, 1)).total, 300);
});
