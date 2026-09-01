import { CreditCard, Transaction, TransactionStatus } from '../types';
import { getCanonicalTransactions, getInvoiceStatementAmount, getOpenCardInvoices } from './financialCalculations';

export interface MonthlyCommitment {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: 'Custo fixo' | 'Fatura do cartão';
  kind: 'FIXED_COST' | 'CARD_INVOICE';
  status: TransactionStatus;
  transactionId?: string;
  cardId?: string;
  outstandingAmount?: number;
}

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const getMonthlyCommitments = (
  transactions: Transaction[], cards: CreditCard[], referenceDate = new Date()
): MonthlyCommitment[] => {
  const key = monthKey(referenceDate);
  const canonicalTransactions = getCanonicalTransactions(transactions);
  const seen = new Set<string>();
  const fixedCosts = canonicalTransactions
    .filter((tx) => tx.origemFinanceira === 'CUSTO_FIXO' && tx.tipo === 'DESPESA' && tx.status !== 'PAGO' && tx.valor > 0 && tx.data.startsWith(key))
    .sort((a, b) => a.data.localeCompare(b.data))
    .filter((tx) => {
      const uniqueKey = `${tx.descricao.trim().toLocaleLowerCase('pt-BR')}|${tx.valor}`;
      if (seen.has(uniqueKey)) return false;
      seen.add(uniqueKey);
      return true;
    })
    .map((tx): MonthlyCommitment => ({
      id: `fixed-${tx.id}`, title: tx.descricao, amount: Math.round(tx.valor * 100) / 100, date: tx.data,
      category: 'Custo fixo', kind: 'FIXED_COST', status: tx.status, transactionId: tx.id,
    }));

  const invoiceCalculations = getOpenCardInvoices(canonicalTransactions, cards)
    .filter((invoice) => invoice.competence === key);
  const cardInvoices = invoiceCalculations.map((invoice): MonthlyCommitment | null => {
    const statementAmount = getInvoiceStatementAmount(invoice);
    if (statementAmount <= 0) return null;
    return {
      id: `invoice-${invoice.cardId}-${key}`, title: invoice.cardName, amount: statementAmount,
      date: invoice.dueDate, category: 'Fatura do cartão', kind: 'CARD_INVOICE',
      status: 'PENDENTE', cardId: invoice.cardId, outstandingAmount: invoice.outstandingAmount,
    };
  }).filter((item): item is MonthlyCommitment => item !== null);

  return [...fixedCosts, ...cardInvoices].sort((a, b) => a.date.localeCompare(b.date));
};
