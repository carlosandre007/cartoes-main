import { CreditCard, CreditContract, RecorrenciaTipo, Transaction } from '../types';
import { getFixedCostRecurrenceId } from './fixedCostRecurrence';

export type CalculatedFlowItem = Transaction & { isCardInvoice?: boolean; invoiceCardId?: string };

export interface CardInvoiceCalculation {
  cardId: string;
  cardName: string;
  competence: string;
  amount: number;
  /** Valor original da fatura, incluindo itens já pagos e abatimentos. */
  statementAmount: number;
  /** Saldo que ainda precisa ser quitado. */
  outstandingAmount: number;
  paidAmount: number;
  dueDate: string;
  status: 'PENDENTE' | 'PAGO';
  transactions: Transaction[];
  allTransactions: Transaction[];
}

export interface PayoffEstimate {
  remainingInstallments: number;
  contractualRemainingAmount: number;
  estimatedPayoffAmount: number;
  estimatedInterestDiscount: number;
  monthlyRate: number;
}

export type UnifiedDebtOrigin = 'CARTAO' | 'FINANCIAMENTO' | 'CUSTO_FIXO';
export interface UnifiedDebtItem {
  id: string;
  origin: UnifiedDebtOrigin;
  description: string;
  reference: string;
  competence?: string;
  dueDate?: string;
  status: string;
  grossAmount: number;
  paidAmount: number;
  contribution: number;
  targetView: 'cartoes' | 'credito' | 'custos-fixos';
  exclusionReason?: string;
}
export interface UnifiedDebtCalculation {
  meaning: string;
  referenceCompetence: string;
  filters: string[];
  calculatedAt: string;
  subtotals: Record<UnifiedDebtOrigin, number>;
  total: number;
  included: UnifiedDebtItem[];
  excluded: UnifiedDebtItem[];
  inconsistencies: string[];
}

/**
 * Estimativa informativa do valor presente das parcelas restantes.
 * O boleto oficial pode incluir encargos, seguros, tarifas e atualização diária.
 */
export const calculateContractPayoffEstimate = (contract: CreditContract): PayoffEstimate => {
  const remainingInstallments = Math.max(0, contract.parcelasTotal - contract.parcelasPagas);
  const contractualRemainingAmount = Math.max(0, contract.valorParcelaMensal * remainingInstallments);
  const registeredMonthlyCet = Math.max(0, contract.cetMensal || 0) / 100;
  const annualRate = Math.max(0, contract.cetAnual || contract.taxaJurosAnual) / 100;
  const monthlyRate = registeredMonthlyCet || (annualRate > 0 ? Math.pow(1 + annualRate, 1 / 12) - 1 : 0);

  let presentValue = contractualRemainingAmount;
  if (remainingInstallments > 0 && monthlyRate > 0) {
    presentValue = contract.valorParcelaMensal
      * ((1 - Math.pow(1 + monthlyRate, -remainingInstallments)) / monthlyRate);
  }

  const registeredBalance = Math.max(0, contract.valorRestante);
  const estimatedPayoffAmount = registeredBalance > 0
    ? Math.min(registeredBalance, presentValue || registeredBalance)
    : presentValue;

  return {
    remainingInstallments,
    contractualRemainingAmount,
    estimatedPayoffAmount,
    estimatedInterestDiscount: Math.max(0, contractualRemainingAmount - estimatedPayoffAmount),
    monthlyRate,
  };
};

const isCancelled = (tx: Transaction) => String(tx.status) === 'CANCELADO';
const isOpen = (tx: Transaction) => tx.status !== 'PAGO' && !isCancelled(tx);
const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
export const getCurrentInvoiceCompetence = (date = new Date()) => monthKey(date);
const addMonths = (competence: string, months: number) => {
  const [year, month] = competence.split('-').map(Number);
  return monthKey(new Date(year, month - 1 + months, 1));
};
const normalizeCardName = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
const sumMoney = (items: Transaction[]) => items.reduce((cents, tx) => cents + Math.round(tx.valor * 100), 0) / 100;

export const resolveTransactionCard = (tx: Transaction, cards: CreditCard[]) => {
  const cardId = tx.cartaoDetalhes?.cartaoId;
  if (cardId) {
    const byId = cards.find((card) => card.id === cardId);
    if (byId) return byId;
  }
  const cardName = normalizeCardName(tx.cartaoDetalhes?.cartaoNome);
  if (cardName) {
    const byName = cards.find((card) => normalizeCardName(card.nome) === cardName);
    if (byName) return byName;
  }
  return cards.length === 1 && tx.origemFinanceira === 'CARTAO_CREDITO' ? cards[0] : undefined;
};

export const transactionBelongsToCard = (tx: Transaction, cards: CreditCard[], cardId: string) =>
  tx.origemFinanceira === 'CARTAO_CREDITO' && resolveTransactionCard(tx, cards)?.id === cardId;

export const calculateInvoiceCompetence = (purchaseDate: string, closingDay: number, dueDay: number) => {
  const [year, month, day] = purchaseDate.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return purchaseDate.slice(0, 7);
  const purchaseMonth = `${year}-${String(month).padStart(2, '0')}`;
  const closingMonth = day > closingDay ? addMonths(purchaseMonth, 1) : purchaseMonth;
  return dueDay <= closingDay ? addMonths(closingMonth, 1) : closingMonth;
};

export const addMonthsToCompetence = addMonths;

export const getInvoiceDueDate = (competence: string, dueDay: number) => {
  const [year, month] = competence.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${competence}-${String(Math.min(Math.max(dueDay, 1), lastDay)).padStart(2, '0')}`;
};

export const getCanonicalTransactions = (transactions: Transaction[]): Transaction[] => {
  const unique = new Map<string, Transaction>();
  transactions.forEach((tx) => { if (!isCancelled(tx)) unique.set(tx.id, tx); });
  return Array.from(unique.values());
};

export const getTransactionInvoiceCompetence = (tx: Transaction, card: CreditCard) => {
  if (tx.cartaoDetalhes?.competenciaFatura) return tx.cartaoDetalhes.competenciaFatura;
  const dueDay = tx.cartaoDetalhes?.diaVencimento || card.vencimentoDia;
  const transactionDay = Number(tx.data.slice(8, 10));
  // Compatibilidade: versões anteriores gravavam a data de vencimento, não a data da compra.
  if (transactionDay === dueDay) return tx.data.slice(0, 7);
  return calculateInvoiceCompetence(
    tx.data,
    tx.cartaoDetalhes?.melhorDiaCompra || card.fechamentoDia,
    dueDay
  );
};

export const getCardInvoices = (transactions: Transaction[], cards: CreditCard[]): CardInvoiceCalculation[] => {
  const groups = new Map<string, Transaction[]>();
  getCanonicalTransactions(transactions)
    .filter((tx) => tx.tipo === 'DESPESA' && tx.origemFinanceira === 'CARTAO_CREDITO')
    .forEach((tx) => {
      const card = resolveTransactionCard(tx, cards);
      if (!card) return;
      const competence = getTransactionInvoiceCompetence(tx, card);
      const key = `${card.id}|${competence}`;
      groups.set(key, [...(groups.get(key) || []), tx]);
    });
  return Array.from(groups.entries()).map(([key, items]) => {
    const [cardId, competence] = key.split('|');
    const card = cards.find((item) => item.id === cardId)!;
    const openItems = items.filter(isOpen);
    const paidItems = items.filter((tx) => tx.status === 'PAGO');
    const status: CardInvoiceCalculation['status'] = openItems.length ? 'PENDENTE' : 'PAGO';
    const considered = openItems.length ? openItems : paidItems;
    const statementAmount = sumMoney(items);
    const outstandingAmount = sumMoney(openItems);
    return {
      cardId, cardName: card.nome, competence,
      // Mantido como saldo em aberto para os fluxos de pagamento, limite e dívida.
      amount: status === 'PENDENTE' ? outstandingAmount : statementAmount,
      statementAmount,
      outstandingAmount,
      paidAmount: sumMoney(paidItems),
      dueDate: getInvoiceDueDate(competence, card.vencimentoDia), status,
      transactions: considered.sort((a, b) => a.data.localeCompare(b.data)),
      allTransactions: [...items].sort((a, b) => a.data.localeCompare(b.data)),
    };
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};

export const getOpenCardInvoices = (transactions: Transaction[], cards: CreditCard[]) =>
  getCardInvoices(transactions, cards).filter((invoice) => invoice.status === 'PENDENTE');

export const getOpenCardInvoice = (transactions: Transaction[], cards: CreditCard[], cardId: string) =>
  getOpenCardInvoices(transactions, cards).find((invoice) => invoice.cardId === cardId);

export const getInvoiceStatementAmount = (invoice?: CardInvoiceCalculation) => invoice?.statementAmount || 0;

export const getConsolidatedFlowItems = (transactions: Transaction[], cards: CreditCard[]): CalculatedFlowItem[] => {
  const canonical = getCanonicalTransactions(transactions);
  const regular: CalculatedFlowItem[] = canonical.filter((tx) => tx.origemFinanceira !== 'CARTAO_CREDITO');
  const invoices: CalculatedFlowItem[] = getCardInvoices(canonical, cards).filter((invoice) => invoice.amount !== 0).map((invoice) => ({
    ...invoice.transactions[0],
    id: `invoice-${invoice.status.toLowerCase()}-${invoice.cardId}-${invoice.competence}`,
    descricao: `Fatura ${invoice.cardName}`, valor: invoice.amount, data: invoice.dueDate,
    status: invoice.status, categoria: 'Fatura do cartão', empresa: invoice.cardName,
    centroCusto: invoice.status === 'PAGO' ? 'Fatura fechada' : 'Fatura aberta',
    cartaoDetalhes: { cartaoId: invoice.cardId, cartaoNome: invoice.cardName, competenciaFatura: invoice.competence },
    isCardInvoice: true, invoiceCardId: invoice.cardId,
  }));
  return [...regular, ...invoices].sort((a, b) => a.data.localeCompare(b.data));
};

export const sumTransactions = (transactions: Transaction[], tipo: 'RECEITA' | 'DESPESA', paidOnly = false) =>
  getCanonicalTransactions(transactions).filter((tx) => tx.tipo === tipo && (!paidOnly || tx.status === 'PAGO')).reduce((sum, tx) => sum + tx.valor, 0);

const countOccurrencesThrough = (startDate: string, endDate: string, recurrence: RecorrenciaTipo) => {
  if (endDate < startDate) return 0;
  if (recurrence === 'UNICA') return 1;

  const [startYear, startMonth, startDay] = startDate.slice(0, 10).split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.slice(0, 10).split('-').map(Number);
  if (![startYear, startMonth, startDay, endYear, endMonth, endDay].every(Number.isFinite)) return 0;

  if (recurrence === 'SEMANAL') {
    const start = Date.UTC(startYear, startMonth - 1, startDay);
    const end = Date.UTC(endYear, endMonth - 1, endDay);
    return Math.floor((end - start) / (7 * 24 * 60 * 60 * 1000)) + 1;
  }

  const intervalMonths = recurrence === 'TRIMESTRAL' ? 3 : recurrence === 'ANUAL' ? 12 : 1;
  const monthsApart = (endYear - startYear) * 12 + endMonth - startMonth;
  if (monthsApart < 0) return 0;
  const lastOccurrenceIndex = Math.floor(monthsApart / intervalMonths);
  const occurrenceMonth = startMonth - 1 + lastOccurrenceIndex * intervalMonths;
  const occurrenceYear = startYear + Math.floor(occurrenceMonth / 12);
  const normalizedMonth = ((occurrenceMonth % 12) + 12) % 12;
  const occurrenceDay = Math.min(startDay, new Date(Date.UTC(occurrenceYear, normalizedMonth + 1, 0)).getUTCDate());
  const lastOccurrence = Date.UTC(occurrenceYear, normalizedMonth, occurrenceDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  return lastOccurrence <= end ? lastOccurrenceIndex + 1 : lastOccurrenceIndex;
};

/**
 * Saldo dos custos fixos: quando existe término, soma todas as parcelas ainda
 * devidas até essa data. Sem término, considera apenas a competência atual.
 */
export const getTotalFixedCostDebt = (transactions: Transaction[], referenceDate = new Date()) => {
  const referenceMonth = monthKey(referenceDate);
  const groups = new Map<string, Transaction[]>();
  getCanonicalTransactions(transactions)
    .filter((tx) => tx.tipo === 'DESPESA' && tx.origemFinanceira === 'CUSTO_FIXO')
    .forEach((tx) => {
      const recurring = tx.custoFixoDetalhes?.recorrencia !== 'UNICA';
      const key = recurring ? getFixedCostRecurrenceId(tx) : tx.id;
      groups.set(key, [...(groups.get(key) || []), tx]);
    });

  const cents = Array.from(groups.values()).reduce((total, group) => {
    const ordered = [...group].sort((a, b) => a.data.localeCompare(b.data));
    const first = ordered[0];
    const details = first.custoFixoDetalhes;
    if (!details?.dataTermino) {
      return total + ordered
        .filter((tx) => tx.status !== 'PAGO' && tx.data.startsWith(referenceMonth))
        .reduce((sum, tx) => sum + Math.round(tx.valor * 100), 0);
    }

    const scheduledCount = countOccurrencesThrough(first.data, details.dataTermino, details.recorrencia || 'MENSAL');
    const unmaterializedCount = Math.max(0, scheduledCount - ordered.length);
    const registeredOpenCents = ordered
      .filter((tx) => tx.status !== 'PAGO')
      .reduce((sum, tx) => sum + Math.round(tx.valor * 100), 0);
    const futureUnitCents = Math.round(ordered.at(-1)!.valor * 100);
    return total + registeredOpenCents + unmaterializedCount * futureUnitCents;
  }, 0);
  return cents / 100;
};

export const getOpenCardDebt = (transactions: Transaction[], cards: CreditCard[], competence = monthKey(new Date())) =>
  getOpenCardInvoices(transactions, cards)
    .filter((invoice) => invoice.competence === competence)
    .reduce((sum, invoice) => sum + invoice.amount, 0);

/** Total para quitação: inclui todas as competências abertas e parcelas futuras já contratadas. */
export const getTotalOpenCardDebt = (transactions: Transaction[], cards: CreditCard[], referenceDate = new Date()) => {
  const currentCompetence = getCurrentInvoiceCompetence(referenceDate);
  const cents = getOpenCardInvoices(transactions, cards).reduce((total, invoice) => {
    const invoiceCents = invoice.transactions.reduce((subtotal, tx) => {
      const isRecurring = Boolean(tx.cartaoDetalhes?.recorrente);
      if (isRecurring && invoice.competence !== currentCompetence) return subtotal;
      return subtotal + Math.round(tx.valor * 100);
    }, 0);
    return total + invoiceCents;
  }, 0);
  return cents / 100;
};

/** Saldo de contratos cadastrados mais financiamentos existentes apenas no fluxo, sem duplicação. */
export const getTotalFinancingDebt = (_transactions: Transaction[], contracts: CreditContract[]) => {
  const registeredById = new Map<string, CreditContract>();
  contracts.filter((contract) => contract.status !== 'LIQUIDADO').forEach((contract) => {
    const existing = registeredById.get(contract.id);
    if (!existing || contract.valorRestante < existing.valorRestante) registeredById.set(contract.id, contract);
  });
  const registeredTotal = Array.from(registeredById.values())
    .reduce((sum, contract) => sum + Math.max(0, contract.valorRestante), 0);
  return registeredTotal;
};

const moneyFromCents = (cents: number) => cents / 100;
const sumItemContributions = (items: UnifiedDebtItem[]) =>
  moneyFromCents(items.reduce((sum, item) => sum + Math.round(item.contribution * 100), 0));

export const calculateUnifiedDebt = (
  transactions: Transaction[], cards: CreditCard[], contracts: CreditContract[], referenceDate = new Date()
): UnifiedDebtCalculation => {
  const competence = monthKey(referenceDate);
  const canonical = getCanonicalTransactions(transactions);
  const included: UnifiedDebtItem[] = [];
  const excluded: UnifiedDebtItem[] = [];
  const inconsistencies: string[] = [];

  getCardInvoices(canonical, cards).forEach((invoice) => {
    const eligible = invoice.transactions.filter((tx) =>
      !(tx.cartaoDetalhes?.recorrente && invoice.competence !== competence)
    );
    const contribution = sumMoney(eligible);
    const grossAmount = sumMoney(invoice.allTransactions.filter((tx) =>
      !(tx.cartaoDetalhes?.recorrente && invoice.competence !== competence)
    ));
    const paidAmount = moneyFromCents(Math.max(0, Math.round((grossAmount - contribution) * 100)));
    const item: UnifiedDebtItem = {
      id: `invoice-${invoice.cardId}-${invoice.competence}`, origin: 'CARTAO',
      description: `Fatura ${invoice.cardName}`, reference: `${invoice.cardId} • ${invoice.cardName}`,
      competence: invoice.competence, dueDate: invoice.dueDate, status: invoice.status,
      grossAmount, paidAmount, contribution, targetView: 'cartoes',
    };
    if (contribution > 0 && invoice.status === 'PENDENTE') included.push(item);
    else excluded.push({ ...item, contribution: 0, exclusionReason: invoice.status === 'PAGO' ? 'Quitado' : 'Recorrência fora da competência atual' });

    invoice.transactions.filter((tx) => tx.cartaoDetalhes?.recorrente && invoice.competence !== competence)
      .forEach((tx) => excluded.push({
        id: tx.id, origin: 'CARTAO', description: tx.descricao, reference: tx.id,
        competence: invoice.competence, dueDate: invoice.dueDate, status: tx.status,
        grossAmount: tx.valor, paidAmount: 0, contribution: 0, targetView: 'cartoes',
        exclusionReason: 'Recorrência futura: entra somente na competência atual',
      }));
  });

  const contractById = new Map<string, CreditContract>();
  contracts.forEach((contract) => {
    const existing = contractById.get(contract.id);
    if (!existing || contract.valorRestante < existing.valorRestante) contractById.set(contract.id, contract);
    else if (existing) inconsistencies.push(`Contrato duplicado para conferência: ${contract.id}`);
  });
  contractById.forEach((contract) => {
    const contribution = contract.status === 'LIQUIDADO' ? 0 : Math.max(0, contract.valorRestante);
    const item: UnifiedDebtItem = {
      id: contract.id, origin: 'FINANCIAMENTO', description: contract.titulo,
      reference: `${contract.id} • ${contract.instituicao}`, dueDate: contract.proximoVencimento,
      status: contract.status, grossAmount: Math.max(0, contract.valorTotal),
      paidAmount: Math.max(0, contract.valorPago), contribution, targetView: 'credito',
    };
    if (contribution > 0) included.push(item);
    else excluded.push({ ...item, exclusionReason: contract.status === 'LIQUIDADO' ? 'Quitado' : 'Sem saldo devedor' });
  });

  const fixedGroups = new Map<string, Transaction[]>();
  canonical.filter((tx) => tx.tipo === 'DESPESA' && tx.origemFinanceira === 'CUSTO_FIXO').forEach((tx) => {
    const key = tx.custoFixoDetalhes?.recorrencia !== 'UNICA' ? getFixedCostRecurrenceId(tx) : tx.id;
    fixedGroups.set(key, [...(fixedGroups.get(key) || []), tx]);
  });
  fixedGroups.forEach((group, groupId) => {
    const ordered = [...group].sort((a, b) => a.data.localeCompare(b.data));
    const first = ordered[0];
    const details = first.custoFixoDetalhes;
    const scoped = details?.dataTermino ? ordered : ordered.filter((tx) => tx.data.startsWith(competence));
    let grossCents = scoped.reduce((sum, tx) => sum + Math.round(tx.valor * 100), 0);
    let paidCents = scoped.filter((tx) => tx.status === 'PAGO').reduce((sum, tx) => sum + Math.round(tx.valor * 100), 0);
    if (details?.dataTermino) {
      const scheduledCount = countOccurrencesThrough(first.data, details.dataTermino, details.recorrencia || 'MENSAL');
      const futureCount = Math.max(0, scheduledCount - ordered.length);
      grossCents += futureCount * Math.round(ordered.at(-1)!.valor * 100);
    }
    const contribution = moneyFromCents(Math.max(0, grossCents - paidCents));
    const item: UnifiedDebtItem = {
      id: groupId, origin: 'CUSTO_FIXO', description: first.descricao, reference: groupId,
      competence: details?.dataTermino ? `${first.data.slice(0, 7)} até ${details.dataTermino.slice(0, 7)}` : competence,
      dueDate: ordered.find((tx) => tx.status !== 'PAGO')?.data || first.data,
      status: contribution > 0 ? 'PENDENTE' : 'PAGO', grossAmount: moneyFromCents(grossCents),
      paidAmount: moneyFromCents(paidCents), contribution, targetView: 'custos-fixos',
    };
    if (contribution > 0) included.push(item);
    else if (scoped.length) excluded.push({ ...item, exclusionReason: 'Quitado' });
    else excluded.push({ ...item, exclusionReason: 'Fora da competência atual' });
  });

  transactions.filter((tx) => tx.status === 'CANCELADO' && ['CARTAO_CREDITO', 'CUSTO_FIXO'].includes(tx.origemFinanceira))
    .forEach((tx) => excluded.push({
      id: tx.id, origin: tx.origemFinanceira === 'CARTAO_CREDITO' ? 'CARTAO' : 'CUSTO_FIXO',
      description: tx.descricao, reference: tx.id, competence: tx.cartaoDetalhes?.competenciaFatura || tx.data.slice(0, 7),
      dueDate: tx.data, status: tx.status, grossAmount: tx.valor, paidAmount: 0, contribution: 0,
      targetView: tx.origemFinanceira === 'CARTAO_CREDITO' ? 'cartoes' : 'custos-fixos', exclusionReason: 'Cancelado',
    }));

  canonical.filter((tx) => tx.origemFinanceira === 'CARTAO_CREDITO' && !resolveTransactionCard(tx, cards))
    .forEach((tx) => inconsistencies.push(`Compra no cartão sem cartão localizável: ${tx.id}`));
  [...included, ...excluded].forEach((item) => {
    if (![item.grossAmount, item.paidAmount, item.contribution].every(Number.isFinite)) {
      inconsistencies.push(`Valor monetário inválido: ${item.reference}`);
    }
  });

  const subtotals = {
    CARTAO: sumItemContributions(included.filter((item) => item.origin === 'CARTAO')),
    FINANCIAMENTO: sumItemContributions(included.filter((item) => item.origin === 'FINANCIAMENTO')),
    CUSTO_FIXO: sumItemContributions(included.filter((item) => item.origin === 'CUSTO_FIXO')),
  };
  const total = moneyFromCents(Object.values(subtotals).reduce((sum, value) => sum + Math.round(value * 100), 0));
  return {
    meaning: 'Saldo de dívidas em aberto para quitação; não inclui previsão de receitas nem fluxo realizado.',
    referenceCompetence: competence,
    filters: ['Somente dados do usuário autenticado já carregados pelo contexto', 'Cancelados e quitados não contribuem', 'Parcelas contratadas de cartão entram; recorrências futuras ainda não', 'Custos fixos sem término consideram a competência atual'],
    calculatedAt: referenceDate.toISOString(), subtotals, total, included, excluded, inconsistencies,
  };
};
