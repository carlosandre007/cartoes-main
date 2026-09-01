import { CreditCard, Transaction } from '../types';
import { getCanonicalTransactions, getCardInvoices } from './financialCalculations';

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
}

export const getMonthlyCategorySpending = (
  transactions: Transaction[], cards: CreditCard[], referenceDate = new Date()
): CategorySpending[] => {
  const competence = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`;
  const centsByCategory = new Map<string, number>();

  const canonical = getCanonicalTransactions(transactions);
  const regularExpenses = canonical.filter((tx) =>
    tx.tipo === 'DESPESA' && tx.origemFinanceira !== 'CARTAO_CREDITO'
    && tx.valor > 0 && tx.data.startsWith(competence)
  );
  // Usa exatamente os itens que formam o valor consolidado da fatura: em uma
  // fatura aberta, somente o saldo; em uma fatura quitada, o total realizado.
  const invoiceExpenses = getCardInvoices(canonical, cards)
    .filter((invoice) => invoice.competence === competence && invoice.amount > 0)
    .flatMap((invoice) => invoice.transactions);

  [...regularExpenses, ...invoiceExpenses].forEach((tx) => {
      const category = tx.categoria.trim() || 'Outros';
      centsByCategory.set(category, (centsByCategory.get(category) || 0) + Math.round(tx.valor * 100));
    });

  const totalCents = Array.from(centsByCategory.values()).reduce((sum, value) => sum + value, 0);
  if (!totalCents) return [];

  return Array.from(centsByCategory, ([category, cents]) => ({
    category,
    amount: cents / 100,
    percentage: (cents / totalCents) * 100,
  })).sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category, 'pt-BR'));
};
