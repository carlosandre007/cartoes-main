import React from 'react';
import {
  Repeat,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  PieChart,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

export const FixedCostsView: React.FC = () => {
  const { transactions, openNewTransactionModal, toggleTransactionStatus } = useFinancial();

  // Filter fixed costs from central stream
  const fixedCostsTxs = transactions.filter(
    (tx) => tx.origemFinanceira === 'CUSTO_FIXO'
  );

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthFixedCosts = fixedCostsTxs.filter((tx) => tx.data.startsWith(currentMonth));
  const totalCustoFixoMensal = currentMonthFixedCosts.reduce((acc, tx) => acc + tx.valor, 0);

  // Group by category
  const categoriesMap: Record<string, number> = {};
  currentMonthFixedCosts.forEach((tx) => {
    categoriesMap[tx.categoria] = (categoriesMap[tx.categoria] || 0) + tx.valor;
  });
  const largestCategory = Object.entries(categoriesMap).sort((a, b) => b[1] - a[1])[0];
  const paidCount = currentMonthFixedCosts.filter((tx) => tx.status === 'PAGO').length;
  const paidPercentage = currentMonthFixedCosts.length ? Math.round(paidCount / currentMonthFixedCosts.length * 100) : 0;

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
            Acompanhe serviços contínuos, assinaturas, condomínios e custos fixos operacionais.
          </p>
        </div>

        <button
          onClick={() =>
            openNewTransactionModal({
              origemFinanceira: 'CUSTO_FIXO',
              tipo: 'DESPESA',
            })
          }
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Cadastrar Custo Fixo</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-lg space-y-2">
          <span className="text-xs font-medium text-zinc-400 block">Total Recorrente Mensal</span>
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
          Detalhamento de Custos Fixos Cadastrados no Fluxo Central
        </h3>

        <div className="space-y-3">
          {fixedCostsTxs.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              Nenhum custo fixo cadastrado ainda.
            </div>
          ) : (
            fixedCostsTxs.map((tx) => (
              <div
                key={tx.id}
                className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-amber-500/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="font-bold text-xs text-zinc-100">{tx.descricao}</div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    Recorrência: {tx.custoFixoDetalhes?.recorrencia || 'MENSAL'} • Próximo
                    Vencimento: <span className="text-amber-400">{tx.data}</span> • Categoria: {tx.categoria}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right font-mono font-bold text-amber-400 text-sm">
                    R$ {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>

                  <button
                    onClick={() => toggleTransactionStatus(tx.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                      tx.status === 'PAGO'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {tx.status === 'PAGO' ? 'Liquidado' : 'Pagar'}
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
