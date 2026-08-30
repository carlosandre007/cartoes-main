import React, { useState } from 'react';
import { Target, TrendingUp, Sparkles, DollarSign, PieChart, Landmark } from 'lucide-react';
import { Impress3DTransaction, Impress3DInvestment } from '../../types/impress3d';

interface Impress3DReportsProps {
  transactions: Impress3DTransaction[];
  investments: Impress3DInvestment[];
}

export const Impress3DReports: React.FC<Impress3DReportsProps> = ({
  transactions,
  investments
}) => {
  // Ponto de Equilíbrio inputs
  const [fixedCosts, setFixedCosts] = useState<string>('500');
  const [variableCostPerPiece, setVariableCostPerPiece] = useState<string>('12.30');
  const [averageSalePrice, setAverageSalePrice] = useState<string>('35.00');

  // Calculations for general results
  const totalInvested = transactions.filter(t => t.type === 'investimento').reduce((sum, t) => sum + t.amount, 0)
    || investments.reduce((sum, i) => sum + i.amount, 0);

  const totalReceitas = transactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
  const totalDespesas = transactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
  const totalAportes = transactions.filter(t => t.type === 'aporte').reduce((sum, t) => sum + t.amount, 0);

  const resultadoOperacional = totalReceitas - totalDespesas;
  // Saldo financeiro considerando investimentos
  const saldoComInvestimentos = resultadoOperacional - totalInvested;

  // Ponto de Equilíbrio calculation
  const fc = parseFloat(fixedCosts) || 0;
  const vc = parseFloat(variableCostPerPiece) || 0;
  const sp = parseFloat(averageSalePrice) || 0;

  const contributionMargin = sp - vc;
  const breakEvenPieces = contributionMargin > 0 ? Math.ceil(fc / contributionMargin) : null;

  // Resumo do Mês
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const getMonthStats = (month: number, year: number) => {
    const monthTxs = transactions.filter(t => {
      const d = new Date(t.date + 'T12:00:00');
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const receita = monthTxs.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
    const despesas = monthTxs.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
    const investimentos = monthTxs.filter(t => t.type === 'investimento').reduce((sum, t) => sum + t.amount, 0);
    const lucro = receita - despesas;
    const vendasCount = monthTxs.filter(t => t.type === 'receita').length;
    const ticketMedio = vendasCount > 0 ? receita / vendasCount : 0;

    return { receita, despesas, lucro, investimentos, vendasCount, ticketMedio };
  };

  const currentMonthStats = getMonthStats(currentMonth, currentYear);

  // Prev Month Stats
  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear -= 1;
  }
  const prevMonthStats = getMonthStats(prevMonth, prevYear);

  const formatBRL = (val: number) => {
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resultado Detalhado do Negócio */}
        <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-850 pb-3">
            <Landmark className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest font-mono">
              Resultado Detalhado do Negócio
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-zinc-850/50">
              <span className="text-zinc-400">Receitas operacionais (Vendas):</span>
              <span className="font-mono text-emerald-400 font-bold">{formatBRL(totalReceitas)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-850/50">
              <span className="text-zinc-400">Despesas operacionais (Insumos/Custos):</span>
              <span className="font-mono text-rose-400 font-bold">− {formatBRL(totalDespesas)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-850/50 bg-zinc-950 px-2.5 rounded-lg border border-zinc-850">
              <span className="text-zinc-300 font-bold uppercase font-mono">Resultado Operacional (Lucro):</span>
              <span className={`font-mono font-black ${resultadoOperacional >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatBRL(resultadoOperacional)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-850/50">
              <span className="text-zinc-400">Investimentos realizados (Equipamento/Insumo inicial):</span>
              <span className="font-mono text-zinc-300 font-bold">{formatBRL(totalInvested)}</span>
            </div>
            <div className="flex justify-between py-2.5 bg-zinc-950 px-2.5 rounded-lg border border-zinc-850">
              <span className="text-zinc-300 font-bold uppercase font-mono">Saldo Financeiro Líquido:</span>
              <span className={`font-mono font-black ${saldoComInvestimentos >= 0 ? 'text-zinc-100' : 'text-rose-400'}`}>
                {saldoComInvestimentos >= 0 ? '+' : ''}{formatBRL(saldoComInvestimentos)}
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 leading-relaxed pt-2">
              ⚠️ <strong>Regra Contábil:</strong> O investimento em ativo fixo (como uma impressora 3D) não é debitado imediatamente como despesa operacional direta para fins de cálculo de margem e ponto de equilíbrio, evitando mascarar a rentabilidade do negócio.
            </div>
          </div>
        </div>

        {/* Simulador Ponto de Equilíbrio */}
        <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-850 pb-3">
            <Target className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest font-mono">
              Ponto de Equilíbrio (Break-Even)
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Custo Fixo Mensal (R$)</label>
              <input
                type="number"
                value={fixedCosts}
                onChange={(e) => setFixedCosts(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Custo Var. Médio/Peça</label>
              <input
                type="number"
                value={variableCostPerPiece}
                onChange={(e) => setVariableCostPerPiece(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Preço Médio Venda</label>
              <input
                type="number"
                value={averageSalePrice}
                onChange={(e) => setAverageSalePrice(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Margem de Contribuição por Peça:</span>
              <span className="font-mono text-zinc-200 font-bold">R$ {contributionMargin.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-xs border-t border-zinc-850 pt-2.5">
              <span className="text-zinc-300 font-bold uppercase font-mono">Meta Mensal de Peças:</span>
              <span className="font-mono text-amber-400 font-black text-sm">
                {breakEvenPieces !== null && breakEvenPieces > 0 ? `${breakEvenPieces} peças` : 'Parâmetros inválidos'}
              </span>
            </div>

            {breakEvenPieces !== null && breakEvenPieces > 0 && (
              <div className="text-[10px] text-zinc-500 leading-normal border-t border-zinc-850/50 pt-2">
                Você precisa vender no mínimo <strong>{breakEvenPieces} peças</strong> por mês (faturamento de {formatBRL(breakEvenPieces * sp)}) para cobrir seus custos fixos operacionais de {formatBRL(fc)} antes de começar a gerar lucro líquido.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumo do Mês */}
      <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-850 pb-3">
          <PieChart className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest font-mono">
            Resumo do Mês Vigente vs Anterior
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mês Vigente */}
          <div className="p-4 bg-zinc-950/70 border border-zinc-850/60 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-amber-400/90 font-mono uppercase tracking-wider">Este Mês</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                <span className="text-[10px] text-zinc-500 block">Receitas</span>
                <span className="font-mono text-emerald-400 font-bold">{formatBRL(currentMonthStats.receita)}</span>
              </div>
              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                <span className="text-[10px] text-zinc-500 block">Despesas</span>
                <span className="font-mono text-zinc-300 font-bold">{formatBRL(currentMonthStats.despesas)}</span>
              </div>
              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 col-span-2 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-zinc-500 block">Lucro do Período</span>
                  <span className={`font-mono font-bold ${currentMonthStats.lucro >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatBRL(currentMonthStats.lucro)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-zinc-500 block">Vendas / Ticket Médio</span>
                  <span className="font-mono text-zinc-300 font-bold text-[11px]">
                    {currentMonthStats.vendasCount} • {formatBRL(currentMonthStats.ticketMedio)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mês Anterior */}
          <div className="p-4 bg-zinc-950/70 border border-zinc-850/60 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-zinc-400/90 font-mono uppercase tracking-wider">Mês Anterior</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                <span className="text-[10px] text-zinc-500 block">Receitas</span>
                <span className="font-mono text-zinc-300 font-semibold">{formatBRL(prevMonthStats.receita)}</span>
              </div>
              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                <span className="text-[10px] text-zinc-500 block">Despesas</span>
                <span className="font-mono text-zinc-400">{formatBRL(prevMonthStats.despesas)}</span>
              </div>
              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 col-span-2 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-zinc-500 block">Lucro Operacional</span>
                  <span className={`font-mono font-semibold ${prevMonthStats.lucro >= 0 ? 'text-zinc-300' : 'text-rose-400'}`}>
                    {formatBRL(prevMonthStats.lucro)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-zinc-500 block">Vendas / Ticket Médio</span>
                  <span className="font-mono text-zinc-400 text-[11px]">
                    {prevMonthStats.vendasCount} • {formatBRL(prevMonthStats.ticketMedio)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
