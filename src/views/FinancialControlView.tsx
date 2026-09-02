import React from 'react';
import { AlertTriangle, BarChart3, CheckCircle2, FileCheck2, History, Scale, Upload } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { useCategories } from '../hooks/useCategories';
import { calculateUnifiedDebt, getCanonicalTransactions, getConsolidatedFlowItems } from '../utils/financialCalculations';
import { calculateBudgetUsage, CategoryBudget, compareCategories, detectFinancialIssues, loadAuditTrail, loadLockedMonths, parseBankStatement, reconcileStatement, ReconciliationRow, setMonthLocked, sumMoney } from '../utils/financialGovernance';

const formatBRL = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const monthNow = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; };
const previousMonth = (month: string) => { const [year, number] = month.split('-').map(Number); const date = new Date(year, number - 2, 1); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; };
type Tab = 'FECHAMENTO' | 'CONCILIACAO' | 'INCONSISTENCIAS' | 'ORCAMENTOS' | 'AUDITORIA';

export const FinancialControlView: React.FC = () => {
  const { transactions, cards, contracts, setActiveView, dataLoadState } = useFinancial();
  const { categories } = useCategories(transactions.map((tx) => tx.categoria));
  const [tab, setTab] = React.useState<Tab>('FECHAMENTO');
  const [month, setMonth] = React.useState(monthNow);
  const [lockedMonths, setLockedMonthsState] = React.useState(loadLockedMonths);
  const [reconciliation, setReconciliation] = React.useState<ReconciliationRow[]>([]);
  const [audit, setAudit] = React.useState(loadAuditTrail);
  const [budgets, setBudgets] = React.useState<CategoryBudget[]>(() => { try { return JSON.parse(localStorage.getItem('aureum_category_budgets_v1') || '[]'); } catch { return []; } });
  React.useEffect(() => { const refresh = () => setAudit(loadAuditTrail()); window.addEventListener('aureum-audit-changed', refresh); return () => window.removeEventListener('aureum-audit-changed', refresh); }, []);
  React.useEffect(() => localStorage.setItem('aureum_category_budgets_v1', JSON.stringify(budgets)), [budgets]);

  const canonical = React.useMemo(() => getCanonicalTransactions(transactions), [transactions]);
  const flow = React.useMemo(() => getConsolidatedFlowItems(canonical, cards), [canonical, cards]);
  const monthFlow = flow.filter((tx) => tx.data.startsWith(month));
  const income = sumMoney(monthFlow.filter((tx) => tx.tipo === 'RECEITA' && tx.status === 'PAGO').map((tx) => tx.valor));
  const expense = sumMoney(monthFlow.filter((tx) => tx.tipo === 'DESPESA' && tx.status === 'PAGO').map((tx) => tx.valor));
  const pending = sumMoney(monthFlow.filter((tx) => tx.tipo === 'DESPESA' && tx.status !== 'PAGO').map((tx) => tx.valor));
  const debt = calculateUnifiedDebt(canonical, cards, contracts, new Date(`${month}-01T12:00:00`));
  const issues = detectFinancialIssues(transactions, cards, contracts);
  const usage = calculateBudgetUsage(budgets, transactions, cards, month);
  const comparison = compareCategories(transactions, cards, month, previousMonth(month));
  const locked = lockedMonths.includes(month);

  const toggleClose = () => {
    setMonthLocked(month, !locked);
    if (!locked) localStorage.setItem(`aureum_month_close_${month}`, JSON.stringify({ month, closedAt: new Date().toISOString(), income, expense, pending, debt: debt.total }));
    setLockedMonthsState(loadLockedMonths());
  };
  const addBudget = () => {
    const category = prompt(`Categoria:\n${categories.join(', ')}`)?.trim(); if (!category) return;
    const value = Number(prompt('Limite mensal (R$):', '0')?.replace(',', '.')); if (!Number.isFinite(value) || value <= 0) return;
    setBudgets((items) => [...items.filter((item) => item.category !== category), { category, monthlyLimit: value }]);
  };
  const importStatement = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    const reader = new FileReader(); reader.onload = () => {
      const rows = parseBankStatement(String(reader.result));
      setReconciliation(reconcileStatement(rows, transactions));
    }; reader.readAsText(file);
  };

  const tabs: [Tab, string][] = [['FECHAMENTO', 'Fechamento mensal'], ['CONCILIACAO', 'Conciliação bancária'], ['INCONSISTENCIAS', 'Inconsistências'], ['ORCAMENTOS', 'Orçamentos'], ['AUDITORIA', 'Auditoria']];
  return <div className="p-6 space-y-6 text-zinc-100">
    <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 border border-amber-500/30"><h2 className="text-xl font-black flex items-center gap-2"><Scale className="w-5 h-5 text-amber-400" /> Controle e Confiabilidade</h2><p className="text-xs text-zinc-400 mt-1">Fechamento, conciliação, consistência, orçamento e histórico de alterações.</p></div>
    <div className="flex gap-2 overflow-x-auto">{tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border ${tab === id ? 'bg-amber-500 text-zinc-950 border-amber-400' : 'bg-zinc-900 text-zinc-300 border-zinc-800'}`}>{label}</button>)}</div>
    {tab === 'FECHAMENTO' && <section className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-4"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold flex items-center gap-2"><FileCheck2 className="w-4 h-4 text-amber-400" /> Fechamento da competência</h3><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-2 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs" /></div><button disabled={dataLoadState !== 'ready'} onClick={toggleClose} className={`px-4 py-2 rounded-xl text-xs font-black ${locked ? 'bg-emerald-500 text-zinc-950' : 'bg-amber-500 text-zinc-950'}`}>{locked ? 'Reabrir competência' : 'Fechar competência'}</button></div><div className="grid sm:grid-cols-4 gap-2">{[['Recebido', income], ['Pago', expense], ['Pendente', pending], ['Dívida aberta', debt.total]].map(([label, value]) => <div key={String(label)} className="p-3 rounded-xl bg-zinc-900"><span className="text-[10px] text-zinc-500">{label}</span><b className="block font-mono text-amber-300">{formatBRL(Number(value))}</b></div>)}</div><p className="text-xs text-zinc-400">{locked ? 'Competência bloqueada contra inclusão, edição e exclusão retroativas.' : 'Competência aberta para alterações.'}</p></section>}
    {tab === 'CONCILIACAO' && <section className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-4"><h3 className="font-bold flex items-center gap-2"><Upload className="w-4 h-4 text-amber-400" /> Importar extrato CSV ou OFX</h3><p className="text-xs text-zinc-400">CSV: data AAAA-MM-DD, descrição e valor; despesas negativas. A conferência não altera seus lançamentos.</p><input type="file" accept=".csv,.ofx,text/csv,application/x-ofx" onChange={importStatement} className="text-xs" /><div className="space-y-2">{reconciliation.map((row) => <div key={row.id} className="p-3 rounded-xl bg-zinc-900 flex justify-between gap-3 text-xs"><div><b>{row.description}</b><p className="text-zinc-500">{row.date} • {row.matchedTransactionId ? `Conciliado com ${row.matchedTransactionId}` : 'Sem correspondência'}</p></div><span className={row.matchedTransactionId ? 'text-emerald-400' : 'text-orange-400'}>{formatBRL(row.amount)}</span></div>)}</div></section>}
    {tab === 'INCONSISTENCIAS' && <section className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-3"><h3 className="font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-400" /> Central de inconsistências ({issues.length})</h3>{issues.length ? issues.map((issue) => <button key={`${issue.id}-${issue.reason}`} onClick={() => setActiveView(issue.target)} className="w-full text-left p-3 rounded-xl bg-zinc-900 border border-zinc-800"><b className="text-xs">{issue.title}</b><p className="text-[11px] text-zinc-400">{issue.severity} • {issue.reason} • {issue.id}</p></button>) : <p className="text-xs text-emerald-400 flex gap-2"><CheckCircle2 className="w-4 h-4" /> Nenhuma inconsistência detectada.</p>}</section>}
    {tab === 'ORCAMENTOS' && <section className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-4"><div className="flex justify-between"><h3 className="font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-amber-400" /> Orçamento por categoria</h3><button onClick={addBudget} className="px-3 py-2 bg-amber-500 text-zinc-950 rounded-xl text-xs font-black">Novo limite</button></div>{usage.map((item) => <div key={item.category} className="space-y-1"><div className="flex justify-between text-xs"><b>{item.category}</b><span>{formatBRL(item.spent)} / {formatBRL(item.monthlyLimit)} • {item.percentage.toFixed(1)}%</span></div><div className="h-2 bg-zinc-900 rounded-full overflow-hidden"><div style={{ width: `${Math.min(100, item.percentage)}%` }} className={`h-full ${item.percentage > 100 ? 'bg-red-500' : 'bg-amber-400'}`} /></div></div>)}<h4 className="font-bold text-sm pt-4">Comparativo com {previousMonth(month)}</h4>{comparison.slice(0, 15).map((item) => <div key={item.category} className="grid grid-cols-4 gap-2 text-xs p-2 bg-zinc-900 rounded-lg"><b>{item.category}</b><span>{formatBRL(item.previous)}</span><span>{formatBRL(item.current)}</span><span className={item.variation > 0 ? 'text-red-400' : 'text-emerald-400'}>{item.variation > 0 ? '+' : ''}{item.variation.toFixed(1)}%</span></div>)}</section>}
    {tab === 'AUDITORIA' && <section className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-3"><h3 className="font-bold flex items-center gap-2"><History className="w-4 h-4 text-amber-400" /> Histórico de alterações</h3>{audit.length ? audit.map((entry) => <details key={entry.id} className="p-3 rounded-xl bg-zinc-900 text-xs"><summary className="cursor-pointer"><b>{entry.action}</b> • {entry.entityId} • {new Date(entry.timestamp).toLocaleString('pt-BR')}</summary><pre className="mt-2 overflow-auto text-[10px] text-zinc-400">{JSON.stringify({ antes: entry.before, depois: entry.after }, null, 2)}</pre></details>) : <p className="text-xs text-zinc-500">O histórico começará a registrar alterações feitas a partir desta versão.</p>}</section>}
  </div>;
};
