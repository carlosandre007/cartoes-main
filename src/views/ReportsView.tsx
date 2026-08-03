import React from 'react';
import {
  PieChart as PieIcon,
  BarChart2,
  FileSpreadsheet,
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { downloadCSVFile, exportTransactionsToCSV } from '../utils/importExport';

export const ReportsView: React.FC = () => {
  const { transactions } = useFinancial();

  const totalReceitas = transactions
    .filter((tx) => tx.tipo === 'RECEITA')
    .reduce((acc, tx) => acc + tx.valor, 0);

  const totalDespesas = transactions
    .filter((tx) => tx.tipo === 'DESPESA')
    .reduce((acc, tx) => acc + tx.valor, 0);

  // Group despesas by category
  const categoriesMap: Record<string, number> = {};
  transactions
    .filter((tx) => tx.tipo === 'DESPESA')
    .forEach((tx) => {
      categoriesMap[tx.categoria] = (categoriesMap[tx.categoria] || 0) + tx.valor;
    });

  const topCategories = Object.entries(categoriesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top single expenses
  const topDespesas = [...transactions]
    .filter((tx) => tx.tipo === 'DESPESA')
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  const handleExportCSV = () => {
    downloadCSVFile(
      `Relatorio_Aureum_BI_${new Date().toISOString().split('T')[0]}.csv`,
      exportTransactionsToCSV(transactions)
    );
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 text-zinc-100 font-sans">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 border border-amber-500/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PieIcon className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              AUREUM EXECUTIVE BI & ANALYTICS
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-zinc-100">Relatórios & BI Financeiro</h2>
          <p className="text-xs text-zinc-400">
            Análise consolidada de saídas, distribuição de custos e relatórios exportáveis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Imprimir PDF</span>
          </button>
        </div>
      </div>

      {/* Overview Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-950/90 border border-emerald-500/20 shadow-xl flex justify-between items-center">
          <div>
            <span className="text-xs text-zinc-400 block">Total de Entradas Gravadas</span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <ArrowUpRight className="w-8 h-8 text-emerald-400" />
        </div>

        <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl flex justify-between items-center">
          <div>
            <span className="text-xs text-zinc-400 block">Total de Saídas Gravadas</span>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <ArrowDownRight className="w-8 h-8 text-amber-400" />
        </div>
      </div>

      {/* Category Breakdown & Top Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Progress */}
        <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-amber-400" />
            Distribuição de Gastos por Categoria
          </h3>

          <div className="space-y-3.5 pt-2">
            {topCategories.map(([catName, catVal]) => {
              const catPct = Math.round((catVal / (totalDespesas || 1)) * 100);

              return (
                <div key={catName} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center font-mono">
                    <span className="font-sans font-bold text-zinc-200">{catName}</span>
                    <span className="text-amber-400 font-bold">
                      R$ {catVal.toLocaleString('pt-BR')} ({catPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                    <div
                      style={{ width: `${catPct}%` }}
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Single Expenses List */}
        <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-amber-400" />
            Maiores Lançamentos de Saída
          </h3>

          <div className="space-y-3">
            {topDespesas.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex justify-between items-center text-xs"
              >
                <div>
                  <div className="font-bold text-zinc-200">{tx.descricao}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {tx.data} • {tx.categoria} • {tx.origemFinanceira}
                  </div>
                </div>

                <div className="font-mono font-bold text-amber-400 text-sm">
                  R$ {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
