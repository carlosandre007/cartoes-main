import { BankAccount, CreditCard, CreditContract, FinancialGoal, Transaction } from '../types';
import { getCanonicalTransactions, getCardInvoices, getConsolidatedFlowItems, getTotalOpenCardDebt } from './financialCalculations';

const money = (value: number) => Number(value.toFixed(2));
const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const parseFinancialNumber = (input: string): number => {
  let normalized = input.trim().replace(/[R$\s]/g, '').replace(/[−–—]/g, '-');
  if (normalized.includes(',') && normalized.includes('.')) normalized = normalized.replace(/\./g, '').replace(',', '.');
  else if (normalized.includes(',')) normalized = normalized.replace(',', '.');
  return Number(normalized);
};

export interface FinancialIntelligenceSummary {
  generatedAt: string;
  currentBalanceInformed: number;
  totals: Record<string, number>;
  cashFlowLast12Months: Array<{ month: string; income: number; expenses: number; result: number }>;
  forecast: Array<{ month: string; income: number; expenses: number; result: number }>;
  goals: FinancialGoal[];
  topExpenseCategories: Array<{ category: string; amount: number }>;
  cardExpenses: Array<{ card: string; openInvoices: number; openAmount: number; paidExpenses: number; limit: number; utilizationPercent: number }>;
  debts: Array<Record<string, string | number>>;
  installments: Array<Record<string, string | number>>;
  upcomingBills: Array<Record<string, string | number>>;
  overdueBills: Array<Record<string, string | number>>;
  expectedIncome: Array<Record<string, string | number>>;
  evolution: Array<{ month: string; net: number }>;
  indicators: Record<string, number>;
}

export interface LocalFinancialAnalysis {
  score: number;
  classification: 'Excelente' | 'Muito Bom' | 'Bom' | 'Regular' | 'Ruim' | 'Crítico';
  analysis: string;
  priority: string;
  alert: string;
  opportunity: string;
  cashSituation: string;
  cardSituation: string;
  nextCriticalDue: string;
  possibleMonthlySavings: number;
}

const brl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const generateLocalFinancialAnalysis = (summary: FinancialIntelligenceSummary): LocalFinancialAnalysis => {
  const { totals, indicators } = summary;
  const current = summary.forecast[0] || { income: 0, expenses: 0, result: 0 };
  const previous = summary.cashFlowLast12Months.at(-2) || { income: 0, expenses: 0, result: 0 };
  const overdueTotal = summary.overdueBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
  const maxCard = [...summary.cardExpenses].sort((a, b) => b.utilizationPercent - a.utilizationPercent)[0];
  const priorityDebt = [...summary.debts].sort((a, b) => Number(b.annualRate || 0) - Number(a.annualRate || 0) || Number(b.outstanding || 0) - Number(a.outstanding || 0))[0];
  const upcoming = [...summary.upcomingBills].sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0];
  const essentialFloor = Math.max(0, totals.monthlyFixedCosts || 0);
  const variableExpenses = Math.max(0, current.expenses - essentialFloor);
  const possibleMonthlySavings = money(variableExpenses * 0.1);

  let score = 100;
  if (summary.currentBalanceInformed < 0) score -= 30;
  if (current.result < 0) score -= 20;
  if (overdueTotal > 0) score -= Math.min(20, 8 + summary.overdueBills.length * 2);
  if (indicators.debtToAssets > 100) score -= 20; else if (indicators.debtToAssets > 50) score -= 10;
  if (indicators.savingsRate < 0) score -= 15; else if (indicators.savingsRate < 10) score -= 7;
  if (maxCard?.utilizationPercent >= 90) score -= 15; else if (maxCard?.utilizationPercent >= 70) score -= 8;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const classification: LocalFinancialAnalysis['classification'] = score >= 90 ? 'Excelente' : score >= 80 ? 'Muito Bom' : score >= 65 ? 'Bom' : score >= 50 ? 'Regular' : score >= 30 ? 'Ruim' : 'Crítico';

  const priority = overdueTotal > 0
    ? `Regularizar ${summary.overdueBills.length} conta(s) vencida(s), totalizando ${brl(overdueTotal)}.`
    : priorityDebt ? `Priorizar ${String(priorityDebt.name)} (${brl(Number(priorityDebt.outstanding || 0))}).` : 'Manter as contas em dia e fortalecer a reserva.';
  const alert = summary.currentBalanceInformed < 0 ? `Saldo informado negativo em ${brl(Math.abs(summary.currentBalanceInformed))}.`
    : maxCard?.utilizationPercent >= 80 ? `${maxCard.card} está com ${maxCard.utilizationPercent.toFixed(1)}% do limite utilizado.`
    : current.result < 0 ? `As despesas do mês superam as entradas em ${brl(Math.abs(current.result))}.` : 'Nenhum alerta crítico identificado hoje.';
  const opportunity = possibleMonthlySavings > 0 ? `Reduzir 10% das despesas variáveis pode liberar ${brl(possibleMonthlySavings)} por mês.` : 'Cadastrar receitas e despesas variáveis permitirá identificar oportunidades.';
  const cashSituation = current.result >= 0 ? `Caixa mensal projetado positivo em ${brl(current.result)}.` : `Caixa mensal projetado negativo em ${brl(Math.abs(current.result))}.`;
  const cardSituation = maxCard ? `${maxCard.card} é o cartão mais utilizado (${maxCard.utilizationPercent.toFixed(1)}%).` : 'Nenhum cartão cadastrado.';
  const nextCriticalDue = upcoming ? `${String(upcoming.description)} em ${String(upcoming.dueDate)}: ${brl(Number(upcoming.amount || 0))}.` : 'Nenhum vencimento futuro pendente.';

  const projections = [7, 15, 30, 90, 180, 365].map((days) => {
    const months = Math.max(1, Math.ceil(days / 30));
    const items = summary.forecast.slice(0, months);
    const result = items.reduce((sum, item) => sum + item.result, 0);
    return `${days} dias: saldo estimado ${brl(summary.currentBalanceInformed + result)}`;
  }).join('\n');
  const category = summary.topExpenseCategories[0];
  const debtChange = totals.totalDebt - (previous.expenses > 0 ? previous.expenses : totals.totalDebt);
  const analysis = `## Diagnóstico Financeiro Local\nNota financeira: ${score}/100 — ${classification}.\nA classificação considera saldo, liquidez, endividamento, atrasos, fluxo de caixa, poupança e uso dos cartões.\n\n## Prioridade do Dia\n${priority}\n\n## Principal Alerta\n${alert}\n\n## Melhor Oportunidade\n${opportunity}\nEconomia anual estimada: ${brl(possibleMonthlySavings * 12)}.\n${category ? `Maior categoria de gastos: ${category.category} (${brl(category.amount)}).` : 'Sem despesas suficientes para comparação por categoria.'}\n\n## Caixa e Cartões\n${cashSituation}\n${cardSituation}\nPróximo vencimento crítico: ${nextCriticalDue}\n\n## Dívidas e Financiamentos\nDívida total: ${brl(totals.totalDebt)}.\nFinanciamentos: ${brl(totals.financing)}.\nEmpréstimos: ${brl(totals.loans)}.\nCarnês: ${brl(totals.storeInstallments)}.\nVariação indicativa: ${debtChange <= 0 ? 'redução' : 'aumento'} de ${brl(Math.abs(debtChange))}.\n\n## Projeções\n${projections}\n\n## Metas\n${summary.goals.length ? summary.goals.map((goal) => `${goal.titulo}: ${Math.min(100, (goal.valorAtual / (goal.valorAlvo || 1)) * 100).toFixed(1)}%`).join('\n') : 'Nenhuma meta cadastrada.'}\n\n## Plano de Ação\n1. ${priority}\n2. ${current.result < 0 ? 'Adiar despesas não essenciais até o caixa voltar a ficar positivo.' : 'Direcionar parte do resultado positivo para reserva ou amortização.'}\n3. ${maxCard?.utilizationPercent >= 70 ? `Evitar novas compras no ${maxCard.card}.` : 'Manter o uso dos cartões abaixo de 70% do limite.'}\n4. ${possibleMonthlySavings > 0 ? `Buscar economia de ${brl(possibleMonthlySavings)} neste mês.` : 'Revisar despesas variáveis.'}\n5. Solicitar ao banco o valor oficial antes de antecipar financiamentos.`;
  return { score, classification, analysis, priority, alert, opportunity, cashSituation, cardSituation, nextCriticalDue, possibleMonthlySavings };
};

export const buildFinancialIntelligenceSummary = ({
  transactions, cards, contracts, bankAccounts, goals, currentBalanceInformed,
}: {
  transactions: Transaction[]; cards: CreditCard[]; contracts: CreditContract[];
  bankAccounts: BankAccount[]; goals: FinancialGoal[]; currentBalanceInformed: number;
}): FinancialIntelligenceSummary => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const currentMonth = monthKey(now);
  const canonical = getCanonicalTransactions(transactions);
  const flow = getConsolidatedFlowItems(canonical, cards);
  const invoices = getCardInvoices(canonical, cards);
  const paid = canonical.filter((tx) => tx.status === 'PAGO');
  const open = flow.filter((tx) => tx.status !== 'PAGO');
  const bankTotal = bankAccounts.reduce((sum, account) => sum + account.saldo, 0);
  const openCardTotal = getTotalOpenCardDebt(canonical, cards);
  const contractDebt = contracts.reduce((sum, contract) => sum + contract.valorRestante, 0);
  const fixedMonthly = canonical.filter((tx) => tx.origemFinanceira === 'CUSTO_FIXO' && tx.data.startsWith(currentMonth) && tx.status !== 'CANCELADO').reduce((sum, tx) => sum + tx.valor, 0);
  const totalIncome = paid.filter((tx) => tx.tipo === 'RECEITA').reduce((sum, tx) => sum + tx.valor, 0);
  const totalExpenses = paid.filter((tx) => tx.tipo === 'DESPESA').reduce((sum, tx) => sum + tx.valor, 0);

  const monthly = (offset: number) => {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const key = monthKey(date);
    const items = flow.filter((tx) => tx.data.startsWith(key));
    const income = items.filter((tx) => tx.tipo === 'RECEITA').reduce((sum, tx) => sum + tx.valor, 0);
    const expenses = items.filter((tx) => tx.tipo === 'DESPESA').reduce((sum, tx) => sum + tx.valor, 0);
    return { month: key, income: money(income), expenses: money(expenses), result: money(income - expenses) };
  };
  const cashFlowLast12Months = Array.from({ length: 12 }, (_, index) => monthly(index - 11));
  const forecast = Array.from({ length: 12 }, (_, index) => monthly(index));

  const categoryMap = new Map<string, number>();
  paid.filter((tx) => tx.tipo === 'DESPESA').forEach((tx) => categoryMap.set(tx.categoria, (categoryMap.get(tx.categoria) || 0) + tx.valor));
  const topExpenseCategories = Array.from(categoryMap.entries()).map(([category, amount]) => ({ category, amount: money(amount) })).sort((a, b) => b.amount - a.amount).slice(0, 10);

  const cardExpenses = cards.map((card) => {
    const openInvoices = invoices.filter((invoice) => invoice.cardId === card.id && invoice.status === 'PENDENTE');
    const openAmount = openInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const paidExpenses = canonical.filter((tx) => tx.origemFinanceira === 'CARTAO_CREDITO' && tx.cartaoDetalhes?.cartaoId === card.id && tx.status === 'PAGO').reduce((sum, tx) => sum + tx.valor, 0);
    return { card: card.nome, openInvoices: openInvoices.length, openAmount: money(openAmount), paidExpenses: money(paidExpenses), limit: money(card.limiteTotal), utilizationPercent: card.limiteTotal ? money((openAmount / card.limiteTotal) * 100) : 0 };
  });

  const debts = [
    ...cardExpenses.filter((card) => card.openAmount > 0).map((card) => ({ type: 'CARTAO', name: card.card, outstanding: card.openAmount, annualRate: 'não informada' })),
    ...contracts.filter((contract) => contract.valorRestante > 0).map((contract) => ({
      type: contract.tipo, name: contract.titulo, institution: contract.instituicao,
      outstanding: money(contract.valorRestante), monthlyPayment: money(contract.valorParcelaMensal),
      annualRate: contract.taxaJurosAnual, remainingInstallments: Math.max(0, contract.parcelasTotal - contract.parcelasPagas),
    })),
  ];

  const installments = canonical.filter((tx) => (tx.cartaoDetalhes?.parcelasTotal || tx.financiamentoDetalhes?.parcelasTotal || 0) > 1 && tx.status !== 'PAGO').map((tx) => ({
    description: tx.descricao, amount: money(tx.valor), dueDate: tx.data,
    current: tx.cartaoDetalhes?.parcelaAtual || tx.financiamentoDetalhes?.parcelaAtual || 1,
    total: tx.cartaoDetalhes?.parcelasTotal || tx.financiamentoDetalhes?.parcelasTotal || 1,
  })).slice(0, 100);
  const toBill = (tx: Transaction) => ({ description: tx.descricao, amount: money(tx.valor), dueDate: tx.data, category: tx.categoria });
  const upcomingBills = open.filter((tx) => tx.tipo === 'DESPESA' && tx.data >= today).map(toBill).slice(0, 50);
  const overdueBills = open.filter((tx) => tx.tipo === 'DESPESA' && tx.data < today).map(toBill).slice(0, 50);
  const expectedIncome = canonical.filter((tx) => tx.tipo === 'RECEITA' && tx.status !== 'PAGO' && tx.data >= today).map(toBill).slice(0, 50);
  const netWorth = bankTotal - openCardTotal - contractDebt;
  const averageIncome = cashFlowLast12Months.reduce((sum, item) => sum + item.income, 0) / 12;
  const averageExpenses = cashFlowLast12Months.reduce((sum, item) => sum + item.expenses, 0) / 12;

  return {
    generatedAt: now.toISOString(), currentBalanceInformed: money(currentBalanceInformed),
    totals: {
      bankAccounts: money(bankTotal), openCardInvoices: money(openCardTotal), totalDebt: money(openCardTotal + contractDebt),
      financing: money(contracts.filter((c) => c.tipo === 'FINANCIAMENTO').reduce((s, c) => s + c.valorRestante, 0)),
      loans: money(contracts.filter((c) => c.tipo === 'EMPRESTIMO').reduce((s, c) => s + c.valorRestante, 0)),
      storeInstallments: money(contracts.filter((c) => c.tipo === 'CARNE').reduce((s, c) => s + c.valorRestante, 0)),
      monthlyFixedCosts: money(fixedMonthly), totalIncome: money(totalIncome), totalExpenses: money(totalExpenses), netWorth: money(netWorth),
    },
    cashFlowLast12Months, forecast, goals, topExpenseCategories, cardExpenses, debts, installments,
    upcomingBills, overdueBills, expectedIncome,
    evolution: cashFlowLast12Months.map((item) => ({ month: item.month, net: item.result })),
    indicators: {
      averageMonthlyIncome: money(averageIncome), averageMonthlyExpenses: money(averageExpenses),
      savingsRate: averageIncome ? money(((averageIncome - averageExpenses) / averageIncome) * 100) : 0,
      debtToAssets: bankTotal ? money(((openCardTotal + contractDebt) / bankTotal) * 100) : 0,
      fixedCostRatio: averageIncome ? money((fixedMonthly / averageIncome) * 100) : 0,
    },
  };
};
