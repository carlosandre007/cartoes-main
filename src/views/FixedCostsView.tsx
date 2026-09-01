import React, { useState } from 'react';
import {
  Repeat,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  PieChart,
  DollarSign,
  AlertCircle,
  Pencil,
  ListPlus,
  Trash2,
  X,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { RecorrenciaTipo } from '../types';
import { getConsolidatedFlowItems } from '../utils/financialCalculations';
import { CurrencyInput } from '../components/CurrencyInput';
import { useCategories } from '../hooks/useCategories';

interface BulkFixedCostRow {
  id: string;
  descricao: string;
  valor: string;
  data: string;
  categoria: string;
  recorrencia: RecorrenciaTipo;
}

const createBulkRow = (dateStr?: string): BulkFixedCostRow => ({
  id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  descricao: '',
  valor: '',
  data: dateStr || new Date().toISOString().slice(0, 10),
  categoria: 'Moradia',
  recorrencia: 'MENSAL',
});

const defaultDateForMonth = (month: string) => {
  const today = new Date().toISOString().slice(0, 10);
  return today.startsWith(month) ? today : `${month}-01`;
};

export const FixedCostsView: React.FC = () => {
  const { transactions, cards, openNewTransactionModal, toggleTransactionStatus, addTransaction, payCardInvoice, deleteTransactions } = useFinancial();
  const { categories } = useCategories(transactions.map((tx) => tx.categoria));
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthsOptions = React.useMemo(() => {
    const list = [];
    const baseDate = new Date();
    baseDate.setMonth(baseDate.getMonth() - 3);
    for (let i = 0; i < 16; i++) {
      const year = baseDate.getFullYear();
      const month = String(baseDate.getMonth() + 1).padStart(2, '0');
      const value = `${year}-${month}`;
      const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(`${value}-01T12:00:00Z`))
        .replace(/^\w/, (c) => c.toUpperCase());
      list.push({ value, label });
      baseDate.setMonth(baseDate.getMonth() + 1);
    }
    return list;
  }, []);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    const prevVal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(prevVal);
    setBulkRows([createBulkRow(defaultDateForMonth(prevVal))]);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month, 1);
    const nextVal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextVal);
    setBulkRows([createBulkRow(defaultDateForMonth(nextVal))]);
  };

  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkFixedCostRow[]>(() => [createBulkRow(defaultDateForMonth(selectedMonth))]);

  const updateBulkRow = (id: string, changes: Partial<BulkFixedCostRow>) => {
    setBulkRows((rows) => rows.map((row) => row.id === id ? { ...row, ...changes } : row));
  };

  const handleSaveBulk = (event: React.FormEvent) => {
    event.preventDefault();
    const validRows = bulkRows.filter((row) => row.descricao.trim() && row.data && Number(row.valor.replace(',', '.')) >= 0);
    if (!validRows.length) {
      alert('Preencha ao menos um custo fixo com descrição, valor e vencimento.');
      return;
    }
    validRows.forEach((row) => {
      addTransaction({
        tipo: 'DESPESA', descricao: row.descricao.trim(), valor: Number(row.valor.replace(',', '.')),
        data: row.data, categoria: row.categoria, empresa: 'Pessoal', centroCusto: 'Custos Fixos',
        formaPagamento: 'A definir', origemFinanceira: 'CUSTO_FIXO', status: 'PENDENTE',
        custoFixoDetalhes: { recorrencia: row.recorrencia, proximoVencimento: row.data, ativo: true },
      });
    });
    alert(`${validRows.length} custos fixos cadastrados com sucesso.`);
    setBulkRows([createBulkRow(defaultDateForMonth(selectedMonth))]);
    setIsBulkOpen(false);
  };

  const handleDeleteFixedCost = async (transactionId: string) => {
    const transaction = transactions.find((tx) => tx.id === transactionId);
    if (!transaction || transaction.origemFinanceira !== 'CUSTO_FIXO') return;
    const recurring = transaction.custoFixoDetalhes?.recorrencia && transaction.custoFixoDetalhes.recorrencia !== 'UNICA';
    if (recurring) {
      if (!confirm(`Excluir o custo fixo recorrente "${transaction.descricao}" e todas as ocorrências futuras?`)) return;
      const baseId = transaction.id.replace(/-\d+$/, '');
      const ids = transactions
        .filter((tx) => tx.origemFinanceira === 'CUSTO_FIXO' && (tx.id === baseId || tx.id.startsWith(`${baseId}-`)))
        .map((tx) => tx.id);
      const deleted = await deleteTransactions(ids);
      if (!deleted) alert('Não foi possível excluir o custo fixo no banco de dados. Tente novamente.');
      return;
    }
    if (confirm(`Excluir o custo fixo "${transaction.descricao}"?`)) {
      const deleted = await deleteTransactions([transaction.id]);
      if (!deleted) alert('Não foi possível excluir o custo fixo no banco de dados. Tente novamente.');
    }
  };

  const monthlyOrigins = new Set(['CUSTO_FIXO', 'CARTAO_CREDITO', 'FINANCIAMENTO', 'EMPRESTIMO', 'CARNE', 'CONSORCIO']);
  const currentMonthFixedCosts = getConsolidatedFlowItems(transactions, cards).filter(
    (tx) => tx.tipo === 'DESPESA' && tx.data.startsWith(selectedMonth) && monthlyOrigins.has(tx.origemFinanceira)
  );
  const totalCustoFixoMensal = currentMonthFixedCosts.reduce((acc, tx) => acc + tx.valor, 0);

  // Group by category
  const categoriesMap: Record<string, number> = {};
  currentMonthFixedCosts.forEach((tx) => {
    categoriesMap[tx.categoria] = (categoriesMap[tx.categoria] || 0) + tx.valor;
  });
  const largestCategory = Object.entries(categoriesMap).sort((a, b) => b[1] - a[1])[0];
  const paidCount = currentMonthFixedCosts.filter((tx) => tx.status === 'PAGO').length;
  const paidPercentage = currentMonthFixedCosts.length ? Math.round(paidCount / currentMonthFixedCosts.length * 100) : 0;

  const formattedMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${selectedMonth}-01T12:00:00Z`))
    .replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div className="p-6 space-y-6 text-zinc-100 font-sans">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 border border-amber-500/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Repeat className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              AUREUM PRIVATE • GESTÃO DE RECORRÊNCIAS
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-zinc-100">Custos Fixos & Despesas Recorrentes</h2>
          <p className="text-xs text-zinc-400">
            Acompanhe custos fixos, parcelas de crédito e faturas dos cartões no mês selecionado.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center bg-zinc-900 border border-amber-500/30 rounded-xl overflow-hidden">
            <button
              onClick={handlePrevMonth}
              className="px-3 py-2 text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer border-r border-zinc-800 text-lg font-bold"
              title="Mês anterior"
            >
              &lsaquo;
            </button>
            <select
              value={selectedMonth}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  setSelectedMonth(val);
                  setBulkRows([createBulkRow(defaultDateForMonth(val))]);
                }
              }}
              className="px-3 py-2 bg-transparent text-xs text-zinc-100 font-bold focus:outline-none cursor-pointer text-center"
              style={{ minWidth: '150px' }}
            >
              {monthsOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-zinc-950 text-zinc-100">
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleNextMonth}
              className="px-3 py-2 text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer border-l border-zinc-800 text-lg font-bold"
              title="Próximo mês"
            >
              &rsaquo;
            </button>
          </div>
          <button
            onClick={() => setIsBulkOpen(true)}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-300 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <ListPlus className="w-4 h-4" />
            <span>Adicionar vários</span>
          </button>
          <button
            onClick={() =>
              openNewTransactionModal({
                origemFinanceira: 'CUSTO_FIXO',
                tipo: 'DESPESA',
                data: `${selectedMonth}-01`,
              })
            }
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Cadastrar Custo Fixo</span>
          </button>
        </div>
      </div>

      {isBulkOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveBulk} className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-950 border border-amber-500/30 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Cadastrar custos fixos em lista</h3>
                <p className="text-xs text-zinc-400">Cada linha será cadastrada com sua recorrência e vencimento.</p>
              </div>
              <button type="button" onClick={() => setIsBulkOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-2">
              {bulkRows.map((row, index) => (
                <div key={row.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1.2fr_1.2fr_1.2fr_auto] gap-2 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
                  <input value={row.descricao} onChange={(e) => updateBulkRow(row.id, { descricao: e.target.value })} placeholder={`Descrição ${index + 1}`} className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100" />
                  <CurrencyInput
                    value={parseFloat(row.valor.replace(',', '.')) || 0}
                    onChange={(numVal) => updateBulkRow(row.id, { valor: String(numVal) })}
                    placeholder="Valor R$"
                    className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                  <input type="date" value={row.data} onChange={(e) => updateBulkRow(row.id, { data: e.target.value })} className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100" />
                  <div><input list="fixed-cost-categories" value={row.categoria} onChange={(e) => updateBulkRow(row.id, { categoria: e.target.value })} placeholder="Categoria" className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100" /><datalist id="fixed-cost-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist></div>
                  <select value={row.recorrencia} onChange={(e) => updateBulkRow(row.id, { recorrencia: e.target.value as RecorrenciaTipo })} className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100">
                    <option value="MENSAL">Mensal</option><option value="SEMANAL">Semanal</option><option value="TRIMESTRAL">Trimestral</option><option value="ANUAL">Anual</option><option value="UNICA">Única</option>
                  </select>
                  <button type="button" disabled={bulkRows.length === 1} onClick={() => setBulkRows((rows) => rows.filter((item) => item.id !== row.id))} className="p-2 text-zinc-500 hover:text-red-400 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
              <button type="button" onClick={() => setBulkRows((rows) => [...rows, createBulkRow(defaultDateForMonth(selectedMonth))])} className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-300 text-xs font-bold flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Adicionar linha</button>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsBulkOpen(false)} className="px-4 py-2.5 rounded-xl bg-zinc-900 text-zinc-300 text-xs font-bold">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 text-xs font-extrabold">Salvar lista</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-lg space-y-2">
          <span className="text-xs font-medium text-zinc-400 block">Compromissos Totais de {formattedMonthName}</span>
          <div className="text-xl font-black font-mono text-amber-400">
            R$ {totalCustoFixoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-500">{currentMonthFixedCosts.length} vencimentos no mês</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-lg space-y-2">
          <span className="text-xs font-medium text-zinc-400 block">Maior Categoria</span>
          <div className="text-lg font-bold text-zinc-200">{largestCategory?.[0] || 'Sem dados'}</div>
          <span className="text-[11px] text-zinc-500">{largestCategory ? `R$ ${largestCategory[1].toLocaleString('pt-BR')}` : 'Nenhum custo no mês'}</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-emerald-500/20 shadow-lg space-y-2">
          <span className="text-xs font-medium text-zinc-400 block">Status de Liquidação</span>
          <div className="text-lg font-bold text-emerald-400 font-mono">{paidPercentage}% Em Dia</div>
          <span className="text-[11px] text-zinc-500">{currentMonthFixedCosts.length - paidCount} pendências no mês</span>
        </div>
      </div>

      {/* Main List */}
      <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-zinc-100">
          Custos Fixos, Parcelas e Faturas de {formattedMonthName}
        </h3>

        <div className="space-y-3">
          {currentMonthFixedCosts.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              Nenhum custo registrado para {formattedMonthName.replace(' de ', '/')}.
            </div>
          ) : (
            [...currentMonthFixedCosts].sort((a, b) => a.data.localeCompare(b.data)).map((tx) => (
              <div
                key={tx.id}
                className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-amber-500/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="font-bold text-xs text-zinc-100">{tx.descricao}</div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {tx.isCardInvoice ? 'Fatura consolidada' : tx.origemFinanceira.replaceAll('_', ' ')} • Vencimento:{' '}
                    <span className="text-amber-400">{tx.data}</span> • Categoria: {tx.categoria}
                  </div>
                  {tx.origemFinanceira === 'CUSTO_FIXO' && <div className="text-[10px] text-zinc-500 font-mono">Recorrência: {tx.custoFixoDetalhes?.recorrencia || 'MENSAL'} • Término: {tx.custoFixoDetalhes?.dataTermino || 'Sem data definida'}</div>}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right font-mono font-bold text-amber-400 text-sm">
                    {tx.valor > 0
                      ? `R$ ${tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      : <span className="text-zinc-400 text-xs">Valor a definir</span>}
                  </div>

                  {!tx.isCardInvoice && <button
                    onClick={() => openNewTransactionModal(tx)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/30 transition-colors cursor-pointer"
                    title="Editar custo fixo"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>}

                  {tx.origemFinanceira === 'CUSTO_FIXO' && (
                    <button
                      onClick={() => handleDeleteFixedCost(tx.id)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Excluir custo fixo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => tx.isCardInvoice && tx.invoiceCardId ? payCardInvoice(tx.invoiceCardId, selectedMonth) : toggleTransactionStatus(tx.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                      tx.status === 'PAGO'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {tx.status === 'PAGO' ? 'Pago' : 'Marcar Pago'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
