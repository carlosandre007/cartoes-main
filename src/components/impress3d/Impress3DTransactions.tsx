import React, { useState } from 'react';
import { Plus, Download, Trash2, Edit3, ShieldAlert, Sparkles, Filter, Search } from 'lucide-react';
import { Impress3DTransaction } from '../../types/impress3d';
import { TransactionModal } from './Impress3DModals';

interface Impress3DTransactionsProps {
  transactions: Impress3DTransaction[];
  onAdd: (tx: Omit<Impress3DTransaction, 'id'>) => Promise<void>;
  onEdit: (id: string, tx: Partial<Impress3DTransaction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const Impress3DTransactions: React.FC<Impress3DTransactionsProps> = ({
  transactions,
  onAdd,
  onEdit,
  onDelete
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Impress3DTransaction | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [paymentFilter, setPaymentFilter] = useState<string>('todos');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const handleEditClick = (tx: Impress3DTransaction) => {
    setSelectedTx(tx);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedTx(null);
    setIsModalOpen(true);
  };

  const handleSave = async (txFields: any) => {
    if (selectedTx) {
      await onEdit(selectedTx.id, txFields);
    } else {
      await onAdd(txFields);
    }
  };

  const handleDeleteClick = async (id: string, desc: string) => {
    const confirm = window.confirm(`Deseja realmente excluir a movimentação "${desc}"?`);
    if (confirm) {
      await onDelete(id);
    }
  };

  // Filter Categories list
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category)));

  // Filter logic
  const filteredTxs = transactions.filter((tx) => {
    if (typeFilter !== 'todos' && tx.type !== typeFilter) return false;
    if (categoryFilter !== 'todos' && tx.category !== categoryFilter) return false;
    if (paymentFilter !== 'todos' && tx.payment_method !== paymentFilter) return false;
    if (searchQuery && !tx.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (startDate && tx.date < startDate) return false;
    if (endDate && tx.date > endDate) return false;
    return true;
  });

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredTxs.length === 0) return;

    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)', 'Forma de Pagamento', 'Observação'];
    const rows = filteredTxs.map(tx => [
      tx.date,
      tx.type.toUpperCase(),
      tx.description,
      tx.category,
      tx.amount.toFixed(2),
      tx.payment_method,
      tx.notes || ''
    ]);

    const csvContent = [headers.join(';'), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(';'))].join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `impress3d_relatorio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header e Ações rápidas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900 border border-amber-500/10 p-5 rounded-2xl">
        <div className="space-y-1">
          <div className="text-[10px] sm:text-xs font-semibold text-amber-400/90 uppercase font-mono tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            FLUXO FINANCEIRO OPERACIONAL
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-zinc-100 font-sans tracking-tight">
            Registros de Movimentações
          </h2>
          <p className="text-[10px] sm:text-xs text-zinc-400 max-w-lg leading-relaxed">
            Consolidação diária de receitas, despesas, aportes de capital do sócio e investimentos estruturais.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            disabled={filteredTxs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 hover:bg-zinc-850 text-zinc-300 font-semibold text-xs border border-zinc-800 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova Movimentação</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 border-b border-zinc-850 pb-2.5">
          <Filter className="w-4 h-4 text-amber-500/80" />
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest font-mono">Filtros de Pesquisa</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          {/* Busca textual */}
          <div className="relative col-span-1 sm:col-span-2">
            <label className="block text-[10px] text-zinc-500 mb-1">Descrição</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">Tipo</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
              <option value="investimento">Investimentos</option>
              <option value="aporte">Aportes</option>
            </select>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">Categoria</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none"
            >
              <option value="todos">Todas</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Data Inicial */}
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1 bg-zinc-950 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none"
            />
          </div>

          {/* Data Final */}
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">Fim</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1 bg-zinc-950 border border-zinc-850 rounded-lg text-zinc-200 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="bg-zinc-900 border border-zinc-850 rounded-2xl overflow-hidden">
        {filteredTxs.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <ShieldAlert className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-semibold font-mono">Nenhum lançamento encontrado</p>
            <p className="text-[10px] text-zinc-500 max-w-xs mx-auto">Tente alterar os filtros ou lance uma nova receita/despesa.</p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-950 text-zinc-400 uppercase font-mono tracking-wider border-b border-zinc-800 text-[10px]">
                    <th className="p-4 font-semibold">Data</th>
                    <th className="p-4 font-semibold">Tipo</th>
                    <th className="p-4 font-semibold">Descrição</th>
                    <th className="p-4 font-semibold">Categoria</th>
                    <th className="p-4 font-semibold">Forma Pagto</th>
                    <th className="p-4 font-semibold text-right">Valor</th>
                    <th className="p-4 font-semibold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 text-zinc-300">
                  {filteredTxs.map((tx) => (
                    <tr
                      key={tx.id}
                      className={`hover:bg-zinc-950/40 transition-colors ${
                        tx.is_demo ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="p-4 font-mono">
                        {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        {tx.is_demo && (
                          <span className="ml-2 px-1.5 py-0.5 text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-semibold uppercase font-mono">Demo</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border font-bold uppercase font-mono ${
                          tx.type === 'receita'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : tx.type === 'despesa'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : tx.type === 'investimento'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-zinc-200">{tx.description}</td>
                      <td className="p-4 text-zinc-400">{tx.category}</td>
                      <td className="p-4 text-zinc-400">{tx.payment_method}</td>
                      <td className={`p-4 font-bold text-right font-mono text-xs ${
                        tx.type === 'receita' || tx.type === 'aporte'
                          ? 'text-emerald-400'
                          : 'text-zinc-200'
                      }`}>
                        R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(tx)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-950 transition-all active:scale-95"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(tx.id, tx.description)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-950 transition-all active:scale-95"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-zinc-850 p-4 space-y-3">
              {filteredTxs.map((tx) => (
                <div
                  key={tx.id}
                  className={`p-3 bg-zinc-950/70 border border-zinc-850/60 rounded-xl space-y-2.5 ${
                    tx.is_demo ? 'border-amber-500/20' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <h4 className="text-xs font-bold text-zinc-200">{tx.description}</h4>
                    </div>
                    <span className={`text-xs font-black font-mono ${
                      tx.type === 'receita' || tx.type === 'aporte'
                        ? 'text-emerald-400'
                        : 'text-zinc-200'
                    }`}>
                      R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase font-mono ${
                      tx.type === 'receita'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : tx.type === 'despesa'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : tx.type === 'investimento'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>{tx.type}</span>
                    <span className="text-zinc-500">{tx.category} • {tx.payment_method}</span>
                  </div>

                  {tx.notes && <p className="text-[10px] text-zinc-500 italic bg-zinc-950 p-1.5 rounded border border-zinc-900">{tx.notes}</p>}

                  <div className="flex justify-end gap-2 border-t border-zinc-900 pt-2 text-[10px]">
                    <button
                      onClick={() => handleEditClick(tx)}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(tx.id, tx.description)}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-rose-950/30 text-rose-400 rounded-lg flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        transaction={selectedTx}
      />
    </div>
  );
};
