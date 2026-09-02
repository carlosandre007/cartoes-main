import { CreditCard, CreditContract, Transaction } from '../types';
import { resolveTransactionCard } from './financialCalculations';
import { getMonthlyCategorySpending } from './categorySpending';

export const toCents = (value: number) => {
  if (!Number.isFinite(value)) throw new Error(`Valor monetário inválido: ${String(value)}`);
  return Math.round(value * 100);
};
export const fromCents = (value: number) => value / 100;
export const sumMoney = (values: number[]) => fromCents(values.reduce((sum, value) => sum + toCents(value), 0));

export interface FinancialIssue { id: string; severity: 'ALTA' | 'MEDIA' | 'BAIXA'; title: string; reason: string; target: 'cartoes' | 'custos-fixos' | 'credito' | 'fluxo'; }
export const detectFinancialIssues = (transactions: Transaction[], cards: CreditCard[], contracts: CreditContract[]): FinancialIssue[] => {
  const issues: FinancialIssue[] = [];
  const seen = new Map<string, string>();
  transactions.forEach((tx) => {
    if (!Number.isFinite(tx.valor)) issues.push({ id: tx.id, severity: 'ALTA', title: tx.descricao, reason: 'Valor monetário inválido', target: 'fluxo' });
    if (!tx.categoria?.trim()) issues.push({ id: tx.id, severity: 'MEDIA', title: tx.descricao, reason: 'Lançamento sem categoria', target: 'fluxo' });
    if (tx.valor === 0) issues.push({ id: tx.id, severity: 'BAIXA', title: tx.descricao, reason: 'Lançamento com valor zerado', target: tx.origemFinanceira === 'CUSTO_FIXO' ? 'custos-fixos' : 'fluxo' });
    if (tx.origemFinanceira === 'CARTAO_CREDITO' && !resolveTransactionCard(tx, cards)) issues.push({ id: tx.id, severity: 'ALTA', title: tx.descricao, reason: 'Cartão não identificado', target: 'cartoes' });
    if (tx.origemFinanceira === 'CARTAO_CREDITO' && !tx.cartaoDetalhes?.competenciaFatura) issues.push({ id: tx.id, severity: 'MEDIA', title: tx.descricao, reason: 'Competência da fatura não informada explicitamente', target: 'cartoes' });
    const signature = `${tx.descricao.trim().toLocaleLowerCase('pt-BR')}|${tx.data}|${toCents(tx.valor)}|${tx.origemFinanceira}`;
    const previous = seen.get(signature);
    if (previous && previous !== tx.id) issues.push({ id: tx.id, severity: 'MEDIA', title: tx.descricao, reason: `Possível duplicidade com ${previous}; conferir antes de excluir`, target: 'fluxo' });
    else seen.set(signature, tx.id);
  });
  contracts.forEach((contract) => {
    if (contract.valorRestante < 0 || contract.valorPago > contract.valorTotal + 0.005) issues.push({ id: contract.id, severity: 'ALTA', title: contract.titulo, reason: 'Saldo ou pagamentos do contrato são incoerentes', target: 'credito' });
  });
  return issues;
};

export interface CategoryBudget { category: string; monthlyLimit: number; }
export const calculateBudgetUsage = (budgets: CategoryBudget[], transactions: Transaction[], cards: CreditCard[], month: string) => {
  const [year, number] = month.split('-').map(Number);
  const spending = getMonthlyCategorySpending(transactions, cards, new Date(year, number - 1, 1));
  return budgets.map((budget) => {
    const spent = spending.find((item) => item.category === budget.category)?.amount || 0;
    return { ...budget, spent, available: fromCents(toCents(budget.monthlyLimit) - toCents(spent)), percentage: budget.monthlyLimit > 0 ? spent / budget.monthlyLimit * 100 : 0 };
  });
};

export const compareCategories = (transactions: Transaction[], cards: CreditCard[], currentMonth: string, previousMonth: string) => {
  const spendingFor = (month: string) => { const [year, number] = month.split('-').map(Number); return getMonthlyCategorySpending(transactions, cards, new Date(year, number - 1, 1)); };
  const currentSpending = spendingFor(currentMonth);
  const previousSpending = spendingFor(previousMonth);
  const categories = Array.from(new Set([...currentSpending, ...previousSpending].map((item) => item.category)));
  return categories.map((category) => {
    const current = currentSpending.find((item) => item.category === category)?.amount || 0;
    const previous = previousSpending.find((item) => item.category === category)?.amount || 0;
    return { category, current, previous, variation: previous ? (current - previous) / previous * 100 : current ? 100 : 0 };
  }).filter((item) => item.current || item.previous).sort((a, b) => b.current - a.current);
};

export interface AuditEntry { id: string; timestamp: string; entity: string; entityId: string; action: 'CRIADO' | 'ALTERADO' | 'EXCLUIDO'; before?: unknown; after?: unknown; }
const AUDIT_KEY = 'aureum_audit_trail_v1';
export const loadAuditTrail = (): AuditEntry[] => { try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]'); } catch { return []; } };
export const appendAuditEntries = (entries: AuditEntry[]) => {
  if (!entries.length) return;
  localStorage.setItem(AUDIT_KEY, JSON.stringify([...entries, ...loadAuditTrail()].slice(0, 2000)));
  window.dispatchEvent(new Event('aureum-audit-changed'));
};

const LOCK_KEY = 'aureum_locked_months_v1';
export const loadLockedMonths = (): string[] => { try { return JSON.parse(localStorage.getItem(LOCK_KEY) || '[]'); } catch { return []; } };
export const setMonthLocked = (month: string, locked: boolean) => localStorage.setItem(LOCK_KEY, JSON.stringify(Array.from(new Set(locked ? [...loadLockedMonths(), month] : loadLockedMonths().filter((item) => item !== month)))));
export const isMonthLocked = (date: string) => loadLockedMonths().includes(date.slice(0, 7));

export interface ReconciliationRow { id: string; date: string; description: string; amount: number; matchedTransactionId?: string; }
export const parseBankStatement = (text: string): ReconciliationRow[] => {
  if (/<STMTTRN>/i.test(text)) {
    return text.split(/<STMTTRN>/i).slice(1).map((block, index) => {
      const dateRaw = block.match(/<DTPOSTED>([^<\r\n]+)/i)?.[1]?.trim().slice(0, 8) || '';
      const amountRaw = block.match(/<TRNAMT>([^<\r\n]+)/i)?.[1]?.trim() || '';
      const description = block.match(/<(?:MEMO|NAME)>([^<\r\n]+)/i)?.[1]?.trim() || 'Movimentação OFX';
      return { id: `ofx-${index}`, date: dateRaw ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}` : '', description, amount: Number(amountRaw.replace(',', '.')) };
    }).filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && Number.isFinite(row.amount));
  }
  return text.split(/\r?\n/).filter(Boolean).slice(1).map((line, index) => {
    const parts = line.includes(';') ? line.split(';') : line.split(',');
    const raw = parts.at(-1)?.trim().replace(/\./g, '').replace(',', '.') || '0';
    return { id: `csv-${index}`, date: parts[0]?.trim(), description: parts.slice(1, -1).join(' ').trim(), amount: Number(raw) };
  }).filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && Number.isFinite(row.amount));
};
export const reconcileStatement = (rows: ReconciliationRow[], transactions: Transaction[]) => rows.map((row) => {
  const match = transactions.find((tx) => tx.data === row.date && toCents(tx.tipo === 'DESPESA' ? -tx.valor : tx.valor) === toCents(row.amount));
  return { ...row, matchedTransactionId: match?.id };
});
