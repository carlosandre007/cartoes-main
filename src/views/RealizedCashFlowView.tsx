import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Edit2, Plus, Trash2, Wallet, X } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { CurrencyInput } from '../components/CurrencyInput';
import { Transaction, TransactionType } from '../types';
import { AUREUM_FLOW_COST_CENTER, buildRealizedCashFlow, CashFlowOrigin, filterRealizedCashFlow, summarizeRealizedCashFlow } from '../utils/realizedCashFlow';
import { useCategories } from '../hooks/useCategories';

const METHODS = ['PIX', 'Dinheiro', 'Débito', 'Transferência', 'Boleto', 'Outro'];
const ORIGIN_LABELS: Record<CashFlowOrigin, string> = {
  RECEITA_PESSOAL: 'Receita pessoal', DESPESA_PESSOAL: 'Despesa pessoal',
  CUSTO_FIXO: 'Custo fixo', PAGAMENTO_CARTAO: 'Pagamento de cartão',
};
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const monthBounds = () => {
  const date = new Date();
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  return { start: `${month}-01`, end: `${month}-${String(new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()).padStart(2, '0')}` };
};

type FormState = { tipo: TransactionType; descricao: string; valor: number; data: string; categoria: string; empresa: string; forma: string; observacao: string; contaId: string };

export const RealizedCashFlowView: React.FC = () => {
  const { transactions, bankAccounts, addTransaction, updateTransaction, deleteTransaction, addBankAccount, updateBankAccount, setActiveView } = useFinancial();
  const bounds = monthBounds();
  const [startDate, setStartDate] = useState(bounds.start);
  const [endDate, setEndDate] = useState(bounds.end);
  const [filterType, setFilterType] = useState<'TODOS' | TransactionType>('TODOS');
  const [filterOrigin, setFilterOrigin] = useState<'TODAS' | CashFlowOrigin>('TODAS');
  const [search, setSearch] = useState('');
  const [groupByDay, setGroupByDay] = useState(false);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const pageSize = 12;

  const realized = useMemo(() => buildRealizedCashFlow(transactions), [transactions]);
  const filtered = useMemo(() => filterRealizedCashFlow(realized, {
    startDate, endDate, tipo: filterType, origem: filterOrigin, search,
  }), [realized, startDate, endDate, filterType, filterOrigin, search]);
  const totals = useMemo(() => summarizeRealizedCashFlow(filtered), [filtered]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const { categories, addCategory } = useCategories(transactions.map((tx) => tx.categoria));

  const openForm = (tipo: TransactionType, tx?: Transaction) => {
    setEditingId(tx?.id || null);
    setForm({
      tipo, descricao: tx?.descricao || '', valor: tx?.valor || 0, data: tx?.data || today(),
      categoria: tx?.categoria || (tipo === 'RECEITA' ? 'Salário' : 'Alimentação'), empresa: tx?.empresa || 'Pessoal',
      forma: tx?.formaPagamento || 'PIX', observacao: tx?.observacao || '',
      contaId: tx?.contaBancariaId || bankAccounts.find((account) => account.ativa)?.id || '',
    });
  };

  const saveManual = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form || !form.descricao.trim() || !Number.isFinite(form.valor) || form.valor <= 0 || !form.data) {
      alert('Informe descrição, valor maior que zero e data efetiva.');
      return;
    }
    const account = bankAccounts.find((item) => item.id === form.contaId);
    const payload = {
      tipo: form.tipo, descricao: form.descricao.trim(), valor: Math.round(form.valor * 100) / 100,
      data: form.data, categoria: form.categoria, empresa: form.empresa.trim() || 'Pessoal', centroCusto: AUREUM_FLOW_COST_CENTER,
      formaPagamento: form.forma, origemFinanceira: 'OUTRO' as const, status: 'PAGO' as const,
      observacao: form.observacao.trim(), contaBancariaId: account?.id, contaBancariaNome: account?.banco,
    };
    if (editingId) updateTransaction(editingId, payload);
    else addTransaction(payload);
    setForm(null);
    setEditingId(null);
  };

  const createCategory = () => {
    const category = prompt('Nome da nova categoria:')?.trim();
    if (category && form) { addCategory(category); setForm({ ...form, categoria: category }); }
  };

  const createBank = () => {
    const banco = prompt('Nome do banco, carteira ou instituição:')?.trim();
    if (!banco) return;
    const agencia = prompt('Agência (opcional):', '0001')?.trim() || '0001';
    const conta = prompt('Conta ou identificação da carteira:')?.trim() || `${Date.now()}`;
    const saldo = Number((prompt('Saldo atual (R$):', '0') || '0').replace(',', '.'));
    if (!Number.isFinite(saldo)) { alert('Informe um saldo válido.'); return; }
    const id = addBankAccount({ banco, agencia, conta, tipo: 'CORRENTE', saldo, logoColor: '#fbbf24', ativa: true });
    if (form) setForm({ ...form, contaId: id });
  };

  const editBank = () => {
    if (!form?.contaId) { alert('Selecione uma conta para editar.'); return; }
    const account = bankAccounts.find((item) => item.id === form.contaId);
    if (!account) return;
    const banco = prompt('Nome do banco, carteira ou instituição:', account.banco)?.trim();
    if (!banco) return;
    const agencia = prompt('Agência:', account.agencia)?.trim() || account.agencia;
    const conta = prompt('Conta ou identificação:', account.conta)?.trim() || account.conta;
    updateBankAccount(account.id, { banco, agencia, conta });
  };

  const goToOrigin = (origin: CashFlowOrigin) => setActiveView(origin === 'PAGAMENTO_CARTAO' ? 'cartoes' : 'custos-fixos');
  const formatBRL = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="p-3 sm:p-6 space-y-5 text-zinc-100">
      <div className="p-5 rounded-2xl bg-zinc-950 border border-amber-500/25 flex flex-col lg:flex-row justify-between gap-4">
        <div><div className="text-[10px] font-mono text-emerald-400 font-bold">FLUXO REALIZADO</div><h2 className="text-xl font-black">Fluxo Financeiro Aureum</h2><p className="text-xs text-zinc-400">Somente dinheiro efetivamente recebido ou pago, pela data efetiva.</p></div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => openForm('DESPESA')} className="px-4 py-2.5 rounded-xl bg-amber-500 text-zinc-950 text-xs font-black flex items-center gap-2"><Plus className="w-4 h-4" />Nova despesa paga</button>
          <button onClick={() => openForm('RECEITA')} className="px-4 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-black flex items-center gap-2"><Plus className="w-4 h-4" />Nova receita recebida</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {[["Entradas do período", totals.entradas, 'text-emerald-400', ArrowUpRight], ["Saídas do período", totals.saidas, 'text-amber-400', ArrowDownRight], ["Resultado do período", totals.resultado, totals.resultado >= 0 ? 'text-emerald-400' : 'text-red-400', Wallet]].map(([label, value, color, Icon]: any) => <div key={label} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between"><div><span className="text-xs text-zinc-400">{label}</span><div className={`text-xl font-black font-mono ${color}`}>{formatBRL(value)}</div></div><Icon className={`w-6 h-6 ${color}`} /></div>)}
      </div>

      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 grid sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
        <label>De<input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="block w-full mt-1 p-2 bg-zinc-900 rounded-lg" /></label>
        <label>Até<input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="block w-full mt-1 p-2 bg-zinc-900 rounded-lg" /></label>
        <label>Tipo<select value={filterType} onChange={(e) => { setFilterType(e.target.value as any); setPage(1); }} className="block w-full mt-1 p-2 bg-zinc-900 rounded-lg"><option value="TODOS">Todos</option><option value="RECEITA">Entradas</option><option value="DESPESA">Saídas</option></select></label>
        <label>Origem<select value={filterOrigin} onChange={(e) => { setFilterOrigin(e.target.value as any); setPage(1); }} className="block w-full mt-1 p-2 bg-zinc-900 rounded-lg"><option value="TODAS">Todas</option>{Object.entries(ORIGIN_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="lg:col-span-2">Consulta<input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Descrição ou categoria" className="block w-full mt-1 p-2 bg-zinc-900 rounded-lg" /></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={groupByDay} onChange={(e) => setGroupByDay(e.target.checked)} />Agrupar visualmente por dia</label>
      </div>

      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-x-auto">
        <table className="w-full text-xs"><thead className="text-zinc-400 bg-zinc-900"><tr><th className="p-3 text-left">Data efetiva</th><th className="p-3 text-left">Descrição</th><th className="p-3 text-left">Categoria</th><th className="p-3 text-left">Origem</th><th className="p-3 text-right">Valor</th><th className="p-3">Ações</th></tr></thead><tbody className="divide-y divide-zinc-900">{visible.length ? visible.map((item, index) => <React.Fragment key={item.id}>{groupByDay && (index === 0 || visible[index - 1].dataEfetiva !== item.dataEfetiva) && <tr><td colSpan={6} className="px-3 py-2 bg-zinc-900/60 text-amber-300 font-bold">{item.dataEfetiva}</td></tr>}<tr><td className="p-3 font-mono">{item.dataEfetiva}</td><td className="p-3"><div className="font-bold">{item.descricao}</div><div className="text-zinc-500">{item.formaPagamento}{item.contaNome ? ` • ${item.contaNome}` : ''}</div></td><td className="p-3">{item.categoria}</td><td className="p-3">{ORIGIN_LABELS[item.origem]}</td><td className={`p-3 text-right font-black font-mono ${item.tipo === 'RECEITA' ? 'text-emerald-400' : 'text-amber-400'}`}>{item.tipo === 'RECEITA' ? '+' : '-'} {formatBRL(item.valor)}</td><td className="p-3"><div className="flex justify-center gap-1">{item.editable ? <><button onClick={() => openForm(item.tipo, transactions.find((tx) => tx.id === item.sourceTransactionIds[0]))} title="Editar" className="p-2"><Edit2 className="w-4 h-4" /></button><button onClick={() => confirm('Excluir este lançamento pessoal?') && deleteTransaction(item.sourceTransactionIds[0])} title="Excluir" className="p-2 text-red-400"><Trash2 className="w-4 h-4" /></button></> : <button onClick={() => goToOrigin(item.origem)} className="text-[10px] text-amber-300">Abrir origem</button>}</div></td></tr></React.Fragment>) : <tr><td colSpan={6} className="p-10 text-center text-zinc-500">Nenhum recebimento ou pagamento efetivo neste período.</td></tr>}</tbody></table>
        <div className="p-3 flex justify-between text-xs text-zinc-400"><span>{filtered.length} registros • totais sobre todos os filtrados</span><div className="flex items-center gap-2"><button disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></button><span>{page}/{totalPages}</span><button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></button></div></div>
      </div>

      {form && <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"><form onSubmit={saveManual} className="w-full max-w-xl bg-zinc-950 border border-amber-500/30 rounded-2xl p-5 space-y-4"><div className="flex justify-between"><div><h3 className="font-black">{editingId ? 'Editar' : 'Registrar'} {form.tipo === 'RECEITA' ? 'receita recebida' : 'despesa paga'}</h3><p className="text-xs text-zinc-400">Este formulário registra dinheiro já efetivamente movimentado. Compras no crédito devem ser cadastradas em Cartões.</p></div><button type="button" onClick={() => setForm(null)}><X className="w-5 h-5" /></button></div><div className="grid sm:grid-cols-2 gap-3 text-xs"><label className="sm:col-span-2">Descrição<input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="block w-full mt-1 p-2.5 bg-zinc-900 rounded-lg" required /></label><label>Valor<CurrencyInput value={form.valor} onChange={(valor) => setForm({ ...form, valor })} className="block w-full mt-1 p-2.5 bg-zinc-900 rounded-lg" /></label><label>Data efetiva<input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="block w-full mt-1 p-2.5 bg-zinc-900 rounded-lg" required /></label><label>Categoria<div className="flex gap-1 mt-1"><select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="min-w-0 flex-1 p-2.5 bg-zinc-900 rounded-lg"><option value="" disabled>Selecione uma categoria</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select><button type="button" onClick={createCategory} className="px-2 rounded-lg border border-amber-500/30 text-amber-300">Nova</button></div></label><label>Forma<select value={form.forma} onChange={(e) => setForm({ ...form, forma: e.target.value })} className="block w-full mt-1 p-2.5 bg-zinc-900 rounded-lg">{METHODS.map((value) => <option key={value}>{value}</option>)}</select></label><label className="sm:col-span-2">Conta, banco ou carteira<div className="flex gap-1 mt-1"><select value={form.contaId} onChange={(e) => setForm({ ...form, contaId: e.target.value })} className="min-w-0 flex-1 p-2.5 bg-zinc-900 rounded-lg"><option value="">Sem vínculo</option>{bankAccounts.map((account) => <option key={account.id} value={account.id}>{account.banco} • {account.conta}</option>)}</select><button type="button" onClick={createBank} className="px-2 rounded-lg border border-amber-500/30 text-amber-300">Novo</button><button type="button" onClick={editBank} disabled={!form.contaId} className="px-2 rounded-lg border border-zinc-700 text-zinc-300 disabled:opacity-40">Editar</button></div></label><label className="sm:col-span-2">Observação<textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} className="block w-full mt-1 p-2.5 bg-zinc-900 rounded-lg" /></label></div><div className="flex justify-end gap-2"><button type="button" onClick={() => setForm(null)} className="px-4 py-2 text-zinc-400">Cancelar</button><button className="px-5 py-2 bg-amber-500 text-zinc-950 rounded-xl font-black">Salvar movimentação</button></div></form></div>}
    </div>
  );
};
