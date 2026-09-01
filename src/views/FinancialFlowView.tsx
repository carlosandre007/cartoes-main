import React, { useState, useRef } from 'react';
import readXlsxFile from 'read-excel-file';
import {
  Search,
  Filter,
  Plus,
  Download,
  CheckCircle,
  Clock,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Building,
  Repeat,
  Landmark,
  Wallet,
  Upload,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { TransactionType, TransactionStatus, OrigemFinanceira } from '../types';
import { parseCSVToTransactions, parseRowsToTransactions, exportTransactionsToCSV, downloadCSVFile } from '../utils/importExport';
import { getConsolidatedFlowItems } from '../utils/financialCalculations';

export const FinancialFlowView: React.FC = () => {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    toggleTransactionStatus,
    openNewTransactionModal,
    searchQuery,
    setSearchQuery,
    cards,
  } = useFinancial();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters state
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [filterOrigem, setFilterOrigem] = useState<string>('TODOS');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [filterCategoria, setFilterCategoria] = useState<string>('TODAS');
  const [filterCompetence, setFilterCompetence] = useState<string>(() => new Date().toISOString().slice(0, 7));

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Filter transactions
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const currentAndFutureTransactions = getConsolidatedFlowItems(transactions, cards)
    .filter((tx) => tx.data >= currentMonthStart)
    .filter((tx) => tx.origemFinanceira !== 'CUSTO_FIXO' || tx.data.startsWith(currentMonthKey));
  const filteredTransactions = currentAndFutureTransactions.filter((tx) => {
    // Search query
    const matchesSearch =
      !searchQuery ||
      tx.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.empresa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.centroCusto.toLowerCase().includes(searchQuery.toLowerCase());

    // Tipo
    const matchesTipo = filterTipo === 'TODOS' || tx.tipo === filterTipo;

    // Origem
    const matchesOrigem = filterOrigem === 'TODOS' || tx.origemFinanceira === filterOrigem;

    // Status
    const matchesStatus = filterStatus === 'TODOS' || tx.status === filterStatus;

    // Categoria
    const matchesCategoria = filterCategoria === 'TODAS' || tx.categoria === filterCategoria;
    const matchesCompetence = filterCompetence === 'TODOS_FUTUROS' || tx.data.startsWith(filterCompetence);

    return matchesSearch && matchesTipo && matchesOrigem && matchesStatus && matchesCategoria && matchesCompetence;
  });

  // Totals for filtered data
  const totalEntradas = filteredTransactions
    .filter((tx) => tx.tipo === 'RECEITA')
    .reduce((acc, tx) => acc + tx.valor, 0);

  const totalSaidas = filteredTransactions
    .filter((tx) => tx.tipo === 'DESPESA')
    .reduce((acc, tx) => acc + tx.valor, 0);

  const saldoFiltrado = totalEntradas - totalSaidas;

  // Pagination slice
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTxs = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CSV Export & Import
  const handleExportCSV = () => {
    const csvData = exportTransactionsToCSV(filteredTransactions);
    downloadCSVFile(`Aureum_Fluxo_Financeiro_${new Date().toISOString().split('T')[0]}.csv`, csvData);
  };

  const handleImportCSVClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const imported = extension === 'xlsx' || extension === 'xls'
        ? parseRowsToTransactions(await readXlsxFile(file) as unknown[][])
        : parseCSVToTransactions(await file.text());
      if (!imported.length) {
        alert('Nenhum lançamento válido encontrado no arquivo. Confira os cabeçalhos Descrição, Valor e Data.');
        return;
      }
      imported.forEach((tx) => addTransaction(tx));
      alert(`${imported.length} lançamentos importados com sucesso para o fluxo central!`);
    } catch (error) {
      console.error('Falha ao importar arquivo:', error);
      alert('Não foi possível ler o arquivo. Use CSV, XLS ou XLSX com cabeçalhos válidos.');
    } finally {
      e.target.value = '';
    }
  };

  // PDF Print Simulation
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 text-zinc-100 font-sans">
      {/* Header bar */}
      <div className="p-4 sm:p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-mono text-[10px] font-bold border border-amber-500/20">
              TABELA UNIFICADA CENTRAL
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-zinc-100 font-sans">
            Fluxo Financeiro Aureum
          </h2>
          <p className="text-xs text-zinc-400">
            {filteredTransactions.length} lançamentos {filterCompetence === 'TODOS_FUTUROS' ? 'do mês atual em diante' : `na competência ${filterCompetence}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.txt,.xls,.xlsx"
            className="hidden"
          />

          <button
            onClick={handleImportCSVClick}
            className="flex-1 sm:flex-initial px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[40px]"
            title="Importar extrato CSV / Excel para o fluxo central"
          >
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Importar CSV/Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[40px]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex-1 sm:flex-initial px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[40px]"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => openNewTransactionModal()}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold rounded-xl text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer min-h-[40px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards of Filtered Result */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 block">Entradas Filtradas</span>
            <span className="text-lg font-black font-mono text-emerald-400">
              R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <ArrowUpRight className="w-6 h-6 text-emerald-400" />
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 block">Saídas Filtradas</span>
            <span className="text-lg font-black font-mono text-amber-400">
              R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <ArrowDownRight className="w-6 h-6 text-amber-400" />
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 block">Resultado do Período</span>
            <span
              className={`text-lg font-black font-mono ${
                saldoFiltrado >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              R$ {saldoFiltrado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <Wallet className="w-6 h-6 text-zinc-400" />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
          <Filter className="w-4 h-4" /> Filtros Avançados do Fluxo
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          {/* Search */}
          <div>
            <label className="text-zinc-400 block mb-1">Buscar por texto</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Descrição, empresa..."
                className="w-full pl-8 pr-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/40"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Competência</label>
            <div className="flex gap-1">
              <input
                type="month"
                value={filterCompetence === 'TODOS_FUTUROS' ? '' : filterCompetence}
                onChange={(e) => { setFilterCompetence(e.target.value || new Date().toISOString().slice(0, 7)); setCurrentPage(1); }}
                className="min-w-0 w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 font-mono"
              />
              <button
                onClick={() => { setFilterCompetence('TODOS_FUTUROS'); setCurrentPage(1); }}
                className={`px-2 py-1.5 rounded-xl border text-[9px] font-bold cursor-pointer ${filterCompetence === 'TODOS_FUTUROS' ? 'bg-amber-500 border-amber-400 text-zinc-950' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                title="Mostrar mês atual e todos os meses futuros"
              >
                FUTURO
              </button>
            </div>
          </div>

          {/* Tipo */}
          <div>
            <label className="text-zinc-400 block mb-1">Tipo</label>
            <select
              value={filterTipo}
              onChange={(e) => {
                setFilterTipo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200"
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="RECEITA">Receitas</option>
              <option value="DESPESA">Despesas</option>
            </select>
          </div>

          {/* Origem Financeira */}
          <div>
            <label className="text-zinc-400 block mb-1">Origem Financeira</label>
            <select
              value={filterOrigem}
              onChange={(e) => {
                setFilterOrigem(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200"
            >
              <option value="TODOS">Todas as Origens</option>
              <option value="CONTA_BANCARIA">Conta Bancária</option>
              <option value="CARTAO_CREDITO">Cartão de Crédito</option>
              <option value="CUSTO_FIXO">Custo Fixo Recorrente</option>
              <option value="FINANCIAMENTO">Financiamento</option>
              <option value="EMPRESTIMO">Empréstimo</option>
              <option value="CARNE">Carnê Parcelado</option>
              <option value="INVESTIMENTO">Investimento</option>
              <option value="IMPOSTO">Imposto</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-zinc-400 block mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200"
            >
              <option value="TODOS">Todos os status</option>
              <option value="PAGO">Pago / Liquidado</option>
              <option value="PENDENTE">Pendente</option>
              <option value="AGENDADO">Agendado</option>
              <option value="AGUARDANDO">Aguardando</option>
            </select>
          </div>

          {/* Categoria */}
          <div>
            <label className="text-zinc-400 block mb-1">Categoria</label>
            <select
              value={filterCategoria}
              onChange={(e) => {
                setFilterCategoria(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200"
            >
              <option value="TODAS">Todas as Categorias</option>
              <option value="Moradia">Moradia</option>
              <option value="Transporte">Transporte</option>
              <option value="Investimentos">Investimentos</option>
              <option value="Serviços">Serviços</option>
              <option value="Empresarial">Empresarial</option>
              <option value="Tributos">Tributos</option>
              <option value="Lazer">Lazer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-zinc-950/90 border border-amber-500/20 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/90 text-zinc-400 font-mono text-[11px] uppercase border-b border-zinc-800">
              <tr>
                <th className="p-3.5 pl-5">Status</th>
                <th className="p-3.5">Data</th>
                <th className="p-3.5">Descrição</th>
                <th className="p-3.5">Origem</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5">Empresa / Custo</th>
                <th className="p-3.5 text-right">Valor (R$)</th>
                <th className="p-3.5 text-center pr-5">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {paginatedTxs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500 text-xs">
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedTxs.map((tx) => {
                  const isPaid = tx.status === 'PAGO';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-zinc-900/50 transition-colors group"
                    >
                      {/* Status badge toggle */}
                      <td className="p-3.5 pl-5">
                        {tx.isCardInvoice ? (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1 ${
                            isPaid
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {isPaid ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {isPaid ? 'Fatura fechada' : 'Fatura aberta'}
                          </span>
                        ) : (
                        <button
                          onClick={() => {
                            if (confirm(`Reverter o pagamento de "${tx.descricao}" e retornar o lançamento para pendente?`)) {
                              toggleTransactionStatus(tx.id);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            isPaid
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                          title="Reverter pagamento e retornar para pendente"
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> Pago • Reverter
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" /> {tx.status}
                            </>
                          )}
                        </button>
                        )}
                      </td>

                      {/* Data */}
                      <td className="p-3.5 font-mono text-zinc-400">{tx.data}</td>

                      {/* Descrição */}
                      <td className="p-3.5 font-medium text-zinc-100 max-w-xs">
                        <div className="truncate font-sans">{tx.descricao}</div>
                        {!tx.isCardInvoice && tx.cartaoDetalhes?.parcelasTotal && (
                          <span className="text-[10px] text-amber-400 font-mono block">
                            Parc. {tx.cartaoDetalhes.parcelaAtual}/{tx.cartaoDetalhes.parcelasTotal}
                          </span>
                        )}
                        {tx.financiamentoDetalhes?.parcelaAtual && (
                          <span className="text-[10px] text-amber-400 font-mono block">
                            Contrato {tx.financiamentoDetalhes.instituicao}
                          </span>
                        )}
                      </td>

                      {/* Origem */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-zinc-300">
                          {tx.origemFinanceira}
                        </span>
                      </td>

                      {/* Categoria */}
                      <td className="p-3.5 text-zinc-300">{tx.categoria}</td>

                      {/* Empresa / Centro de Custo */}
                      <td className="p-3.5 text-zinc-400 text-[11px]">
                        <div>{tx.empresa}</div>
                        <div className="text-[10px] text-zinc-500">{tx.centroCusto}</div>
                      </td>

                      {/* Valor */}
                      <td className="p-3.5 text-right font-mono font-bold text-sm">
                        <span
                          className={tx.tipo === 'RECEITA' || (tx.origemFinanceira === 'CARTAO_CREDITO' && tx.valor < 0) ? 'text-emerald-400' : 'text-amber-400'}
                        >
                          {tx.tipo === 'RECEITA' || tx.valor < 0 ? '+' : '-'} R${' '}
                          {Math.abs(tx.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center pr-5">
                        {tx.isCardInvoice ? (
                          <span className="text-[10px] text-zinc-500">Consolidada</span>
                        ) : (
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() =>
                              openNewTransactionModal(tx)
                            }
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-900"
                            title="Editar lançamento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Deseja excluir este lançamento do fluxo central?')) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-900"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-zinc-900/60 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Mostrando {paginatedTxs.length} de {filteredTransactions.length} registros (Página{' '}
            {currentPage} de {totalPages})
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-40 hover:text-zinc-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-zinc-200">{currentPage}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-40 hover:text-zinc-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
