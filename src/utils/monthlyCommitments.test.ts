import assert from 'node:assert/strict';
import test from 'node:test';
import { CreditCard, Transaction, TransactionStatus } from '../types';
import { getMonthlyCommitments } from './monthlyCommitments';

const card: CreditCard = {
  id: 'mercado-pago-8418', nome: 'MERCADO PAGO', bandeira: 'MASTERCARD', finalCartao: '8418',
  limiteTotal: 21800, limiteUtilizado: 0, fechamentoDia: 15, vencimentoDia: 20,
  corGradiente: '#303b7c', categoriaCard: 'AUREUM BLACK',
};

const purchase = (id: string, valor: number, status: TransactionStatus): Transaction => ({
  id, tipo: 'DESPESA', descricao: id, valor, data: '2026-08-25', categoria: 'Teste',
  empresa: 'Pessoal', centroCusto: 'Cartão', formaPagamento: 'Cartão de Crédito',
  origemFinanceira: 'CARTAO_CREDITO', status,
  cartaoDetalhes: { cartaoId: card.id, cartaoNome: card.nome, competenciaFatura: '2026-09' },
});

test('dashboard mostra o total integral da fatura e preserva o saldo após abatimentos', () => {
  const transactions = [
    purchase('soprador', 74.92, 'PAGO'),
    purchase('hub', 38.35, 'PAGO'),
    purchase('moto', 618.75, 'PENDENTE'),
    purchase('notebook', 457.07, 'AGENDADO'),
  ];

  const [invoice] = getMonthlyCommitments(transactions, [card], new Date(2026, 8, 1));
  assert.equal(invoice.kind, 'CARD_INVOICE');
  assert.equal(invoice.amount, 1189.09);
  assert.equal(invoice.outstandingAmount, 1075.82);
});

test('dashboard não lista custo fixo zerado e mantém custo válido em centavos', () => {
  const fixed = (id: string, valor: number): Transaction => ({
    id, tipo: 'DESPESA', descricao: id, valor, data: '2026-09-10', categoria: 'Casa',
    empresa: 'Pessoal', centroCusto: 'Custos Fixos', formaPagamento: 'PIX',
    origemFinanceira: 'CUSTO_FIXO', status: 'PENDENTE',
  });

  const commitments = getMonthlyCommitments([fixed('gás', 0), fixed('água', 78.005)], [], new Date(2026, 8, 1));
  assert.deepEqual(commitments.map(({ title, amount }) => ({ title, amount })), [{ title: 'água', amount: 78.01 }]);
});
