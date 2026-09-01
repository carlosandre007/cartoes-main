import assert from 'node:assert/strict';
import test from 'node:test';
import { CreditCard, Transaction, TransactionStatus } from '../types';
import {
  getCardInvoices,
  getInvoiceStatementAmount,
  getOpenCardInvoice,
  getTotalOpenCardDebt,
} from './financialCalculations';

const mercadoPago: CreditCard = {
  id: 'mercado-pago-8418', nome: 'MERCADO PAGO', bandeira: 'MASTERCARD', finalCartao: '8418',
  limiteTotal: 21800, limiteUtilizado: 0, fechamentoDia: 15, vencimentoDia: 20,
  corGradiente: '#303b7c', categoriaCard: 'AUREUM BLACK',
};

const transaction = (
  id: string,
  valor: number,
  status: TransactionStatus,
  competence = '2026-09',
  installment = 1,
): Transaction => ({
  id, tipo: 'DESPESA', descricao: id, valor, data: '2026-08-25', categoria: 'Teste',
  empresa: 'Pessoal', centroCusto: 'Teste', formaPagamento: 'Cartão de Crédito',
  origemFinanceira: 'CARTAO_CREDITO', status,
  cartaoDetalhes: {
    cartaoId: mercadoPago.id, cartaoNome: mercadoPago.nome,
    parcelaAtual: installment, parcelasTotal: installment > 1 ? 5 : 1,
    competenciaFatura: competence, dataCompra: '2026-08-25',
  },
});

const septemberTransactions = [
  transaction('soprador', 74.92, 'PAGO'),
  transaction('hub', 38.35, 'PAGO'),
  transaction('moto-1', 618.75, 'PENDENTE'),
  transaction('notebook-1', 457.07, 'AGENDADO'),
];

test('card exibe o total integral de setembro e preserva o saldo após pagamentos', () => {
  const invoice = getOpenCardInvoice(septemberTransactions, [mercadoPago], mercadoPago.id);

  assert.ok(invoice);
  assert.equal(invoice.competence, '2026-09');
  assert.equal(invoice.allTransactions.length, 4);
  assert.equal(invoice.transactions.length, 2);
  assert.equal(invoice.statementAmount, 1189.09);
  assert.equal(getInvoiceStatementAmount(invoice), 1189.09);
  assert.equal(invoice.paidAmount, 113.27);
  assert.equal(invoice.outstandingAmount, 1075.82);
  assert.equal(invoice.amount, 1075.82, 'fluxos de quitação continuam usando somente o saldo');
});

test('competência cadastrada prevalece sobre a data informativa da compra', () => {
  const nextInstallment = transaction('moto-2', 618.75, 'AGENDADO', '2026-10', 2);
  const invoices = getCardInvoices([...septemberTransactions, nextInstallment], [mercadoPago]);

  const september = invoices.find((invoice) => invoice.competence === '2026-09');
  const october = invoices.find((invoice) => invoice.competence === '2026-10');
  assert.equal(september?.statementAmount, 1189.09);
  assert.equal(october?.statementAmount, 618.75);
  assert.equal(september?.allTransactions.some((tx) => tx.id === nextInstallment.id), false);
});

test('inclusão, exclusão e troca de competência recalculam o total em centavos', () => {
  const included = [...septemberTransactions, transaction('ajuste', 0.1, 'PENDENTE'), transaction('ajuste-2', 0.2, 'PENDENTE')];
  assert.equal(getOpenCardInvoice(included, [mercadoPago], mercadoPago.id)?.statementAmount, 1189.39);

  const deleted = included.filter((tx) => tx.id !== 'hub');
  assert.equal(getOpenCardInvoice(deleted, [mercadoPago], mercadoPago.id)?.statementAmount, 1151.04);

  const moved = included.map((tx) => tx.id === 'soprador'
    ? { ...tx, cartaoDetalhes: { ...tx.cartaoDetalhes!, competenciaFatura: '2026-10' } }
    : tx);
  const invoices = getCardInvoices(moved, [mercadoPago]);
  assert.equal(invoices.find((invoice) => invoice.competence === '2026-09')?.statementAmount, 1114.47);
  assert.equal(invoices.find((invoice) => invoice.competence === '2026-10')?.statementAmount, 74.92);
});

test('dívida unificada soma recorrência somente no mês corrente e mantém parcelas futuras', () => {
  const recurring = (tx: Transaction): Transaction => ({
    ...tx,
    cartaoDetalhes: {
      ...tx.cartaoDetalhes!, recorrente: true, recorrenciaId: 'rec-mensal', recorrenciaAtiva: true,
    },
  });
  const items = [
    recurring(transaction('rec-setembro', 100, 'PENDENTE', '2026-09')),
    recurring(transaction('rec-outubro', 100, 'AGENDADO', '2026-10')),
    transaction('parcela-setembro', 200, 'PENDENTE', '2026-09'),
    transaction('parcela-outubro', 300, 'AGENDADO', '2026-10', 2),
  ];

  assert.equal(getTotalOpenCardDebt(items, [mercadoPago], new Date(2026, 8, 15)), 600);
});
