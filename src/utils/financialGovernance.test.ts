import assert from 'node:assert/strict';
import test from 'node:test';
import { CreditCard, Transaction } from '../types';
import { calculateBudgetUsage, compareCategories, detectFinancialIssues, parseBankStatement, reconcileStatement, sumMoney } from './financialGovernance';

const card: CreditCard = { id: 'card', nome: 'Cartão', bandeira: 'VISA', finalCartao: '1234', limiteTotal: 1000, limiteUtilizado: 0, fechamentoDia: 10, vencimentoDia: 20, corGradiente: '#000', categoriaCard: 'AUREUM BLACK' };
const tx = (id: string, value: number, category: string, date = '2026-09-10'): Transaction => ({ id, tipo: 'DESPESA', descricao: id, valor: value, data: date, categoria: category, empresa: 'Pessoal', centroCusto: 'Pessoal', formaPagamento: 'PIX', origemFinanceira: 'OUTRO', status: 'PAGO' });

test('operações monetárias compartilhadas mantêm centavos', () => assert.equal(sumMoney([0.1, 0.2, 10.005]), 10.31));

test('orçamento e comparação usam categorias reais, inclusive compra no cartão', () => {
  const purchase = { ...tx('ads', 75, 'ADS GOOGLE', '2026-08-25'), origemFinanceira: 'CARTAO_CREDITO' as const, status: 'PENDENTE' as const, cartaoDetalhes: { cartaoId: card.id, cartaoNome: card.nome, competenciaFatura: '2026-09' } };
  const transactions = [purchase, tx('old', 50, 'ADS GOOGLE', '2026-08-10')];
  assert.deepEqual(calculateBudgetUsage([{ category: 'ADS GOOGLE', monthlyLimit: 100 }], transactions, [card], '2026-09')[0], { category: 'ADS GOOGLE', monthlyLimit: 100, spent: 75, available: 25, percentage: 75 });
  assert.deepEqual(compareCategories(transactions, [card], '2026-09', '2026-08')[0], { category: 'ADS GOOGLE', current: 75, previous: 50, variation: 50 });
});

test('central sinaliza duplicidade sem excluir registros', () => {
  const issues = detectFinancialIssues([tx('a', 10, 'Casa'), { ...tx('b', 10, 'Casa'), descricao: 'a' }], [], []);
  assert.equal(issues.some((issue) => issue.reason.includes('Possível duplicidade')), true);
});

test('conciliação associa data e valor assinado sem alterar movimentos', () => {
  const transactions = [tx('expense', 25.5, 'Casa')];
  const [row] = reconcileStatement([{ id: 'row', date: '2026-09-10', description: 'PIX', amount: -25.5 }], transactions);
  assert.equal(row.matchedTransactionId, 'expense');
  assert.equal(transactions[0].status, 'PAGO');
});

test('importação reconhece CSV e OFX sem gravar dados', () => {
  assert.equal(parseBankStatement('data;descricao;valor\n2026-09-10;Conta;-25,50')[0].amount, -25.5);
  const ofx = '<STMTTRN><DTPOSTED>20260910120000<TRNAMT>-30.25<MEMO>Mercado</STMTTRN>';
  assert.deepEqual(parseBankStatement(ofx)[0], { id: 'ofx-0', date: '2026-09-10', description: 'Mercado', amount: -30.25 });
});
