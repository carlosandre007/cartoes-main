import React from 'react';
import { DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Printer, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';
import { Impress3DTransaction, Impress3DInvestment } from '../../types/impress3d';

interface Impress3DDashboardProps {
  transactions: Impress3DTransaction[];
  investments: Impress3DInvestment[];
}

export const Impress3DDashboard: React.FC<Impress3DDashboardProps> = ({
  transactions,
  investments
}) => {
  // Calculations
  const totalInvested = transactions.filter(t => t.type === 'investimento').reduce((sum, t) => sum + t.amount, 0)
    || investments.reduce((sum, i) => sum + i.amount, 0);

  const totalAportes = transactions.filter(t => t.type === 'aporte').reduce((sum, t) => sum + t.amount, 0);
  const totalReceitas = transactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
  const totalDespesas = transactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);

  // Resultado Operacional = Receitas - Despesas
  const resultadoOperacional = totalReceitas - totalDespesas;

  // Saldo de caixa = Aportes + Receitas - Despesas - Investimentos
  const saldoCaixa = totalAportes + totalReceitas - totalDespesas - totalInvested;

  // Lucro acumulado = Resultado Operacional
  const lucroAcumulado = resultadoOperacional;

  // Margem de lucro = Lucro Acumulado / Receita Total * 100
  const margemLucro = totalReceitas > 0 ? (lucroAcumulado / totalReceitas) * 100 : 0;

  // ROI = Lucro acumulado / Investimento total * 100
  const roiValue = totalInvested > 0 ? (lucroAcumulado / totalInvested) * 100 : null;

  // Alertas Inteligentes
  const getAlerts = () => {
    const alerts: { text: string; color: 'success' | 'danger' | 'warning' }[] = [];

    if (lucroAcumulado > 0) {
      alerts.push({ text: 'O negócio apresentou lucro acumulado nas operações.', color: 'success' });
    } else if (lucroAcumulado < 0) {
      alerts.push({ text: 'As despesas operacionais estão maiores que as receitas (Prejuízo operacional).', color: 'danger' });
    } else {
      alerts.push({ text: 'Operação no ponto de equilíbrio operacional (sem lucro nem prejuízo).', color: 'warning' });
    }

    if (totalInvested > 0 && lucroAcumulado < totalInvested) {
      alerts.push({ text: 'Você ainda não recuperou o valor total investido em equipamentos/estrutura.', color: 'warning' });
    } else if (totalInvested > 0 && lucroAcumulado >= totalInvested) {
      alerts.push({ text: 'Parabéns! O lucro operacional já cobriu 100% dos investimentos iniciais (ROI positivo).', color: 'success' });
    }

    // Comparativo mensal simples
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthTxs = transactions.filter(t => {
      const d = new Date(t.date + 'T12:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const prevMonthTxs = transactions.filter(t => {
      const d = new Date(t.date + 'T12:00:00');
      // Previous month
      let prevM = currentMonth - 1;
      let prevY = currentYear;
      if (prevM < 0) {
        prevM = 11;
        prevY -= 1;
      }
      return d.getMonth() === prevM && d.getFullYear() === prevY;
    });

    const currentMonthReceita = currentMonthTxs.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
    const prevMonthReceita = prevMonthTxs.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);

    if (currentMonthReceita > prevMonthReceita && prevMonthReceita > 0) {
      alerts.push({ text: 'A receita deste mês aumentou em relação ao mês anterior.', color: 'success' });
    }

    return alerts;
  };

  const smartAlerts = getAlerts();

  // Gráficos SVG (Receita x Despesa)
  const renderSimpleChart = () => {
    // Agrupar por categoria de despesas
    const despesasPorCategoria: Record<string, number> = {};
    transactions.filter(t => t.type === 'despesa').forEach(t => {
      despesasPorCategoria[t.category] = (despesasPorCategoria[t.category] || 0) + t.amount;
    });

    const categories = Object.keys(despesasPorCategoria);
    const maxVal = Math.max(...Object.values(despesasPorCategoria), 1);

    return (
      <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">
          Despesas por Categoria
        </h3>
        {categories.length === 0 ? (
          <p className="text-[10px] text-zinc-500 font-mono">Nenhum dado de despesa para exibir.</p>
        ) : (
          <div className="space-y-3">
            {categories.map(cat => {
              const val = despesasPorCategoria[cat];
              const pct = (val / maxVal) * 100;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400 font-medium">{cat}</span>
                    <span className="font-mono text-zinc-200 font-bold">R$ {val.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Alertas Inteligentes */}
      {smartAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {smartAlerts.map((alert, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                alert.color === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : alert.color === 'danger'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{alert.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* 2. Grid de KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* INVESTIMENTO TOTAL */}
        <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-2xl flex flex-col justify-between min-h-[96px]">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Investimento Total</span>
            <span className="text-sm sm:text-lg font-black font-mono text-zinc-100 block mt-1">
              R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-2 font-mono">
            <Printer className="w-3.5 h-3.5 text-amber-500" />
            <span>Estrutura & Equipamento</span>
          </div>
        </div>

        {/* APORTES */}
        <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-2xl flex flex-col justify-between min-h-[96px]">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Capital Aportado</span>
            <span className="text-sm sm:text-lg font-black font-mono text-zinc-100 block mt-1">
              R$ {totalAportes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-2 font-mono">
            <Wallet className="w-3.5 h-3.5 text-amber-500" />
            <span>Recursos Injetados</span>
          </div>
        </div>

        {/* RECEITA TOTAL */}
        <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-2xl flex flex-col justify-between min-h-[96px]">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Receita Total</span>
            <span className="text-sm sm:text-lg font-black font-mono text-emerald-400 block mt-1">
              R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-2 font-mono">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Faturamento Bruto</span>
          </div>
        </div>

        {/* DESPESAS TOTAIS */}
        <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-2xl flex flex-col justify-between min-h-[96px]">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Despesas Totais</span>
            <span className="text-sm sm:text-lg font-black font-mono text-rose-400 block mt-1">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-2 font-mono">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
            <span>Custos Operacionais</span>
          </div>
        </div>

        {/* RESULTADO OPERACIONAL */}
        <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-2xl flex flex-col justify-between min-h-[96px]">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Resultado Operacional</span>
            <span className={`text-sm sm:text-lg font-black font-mono block mt-1 ${
              resultadoOperacional >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              R$ {resultadoOperacional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-2 font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            <span>Receitas - Despesas</span>
          </div>
        </div>

        {/* SALDO DE CAIXA */}
        <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-2xl flex flex-col justify-between min-h-[96px]">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Saldo de Caixa</span>
            <span className={`text-sm sm:text-lg font-black font-mono block mt-1 ${
              saldoCaixa >= 0 ? 'text-zinc-100' : 'text-rose-400'
            }`}>
              R$ {saldoCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-2 font-mono">
            <Wallet className="w-3.5 h-3.5 text-amber-500" />
            <span>Caixa Líquido Atual</span>
          </div>
        </div>

        {/* MARGEM DE LUCRO */}
        <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-2xl flex flex-col justify-between min-h-[96px]">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Margem de Lucro</span>
            <span className="text-sm sm:text-lg font-black font-mono text-amber-400 block mt-1">
              {margemLucro.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-2 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Eficiência Operacional</span>
          </div>
        </div>

        {/* ROI */}
        <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-2xl flex flex-col justify-between min-h-[96px]">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Retorno s/ Investimento (ROI)</span>
            <span className="text-sm sm:text-lg font-black font-mono text-amber-400 block mt-1">
              {roiValue !== null ? `${roiValue.toFixed(2)}%` : 'ROI não calculável'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-2 font-mono">
            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
            <span>Recuperação do Capital</span>
          </div>
        </div>
      </div>

      {/* 3. Área Gráfica */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Receita x Despesa Comparativo Simplificado */}
        <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">
            Receitas vs Despesas Operacionais
          </h3>
          <div className="flex items-end justify-around h-48 pt-6 pb-2 bg-zinc-950 rounded-xl border border-zinc-850">
            {/* Receitas bar */}
            <div className="flex flex-col items-center space-y-2 w-16">
              <div className="text-[10px] font-bold font-mono text-emerald-400">
                R$ {totalReceitas.toFixed(0)}
              </div>
              <div
                className="w-10 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-500"
                style={{ height: `${totalReceitas > 0 ? Math.min(120, (totalReceitas / Math.max(totalReceitas, totalDespesas, 1)) * 120) : 4}px` }}
              />
              <span className="text-[9px] font-mono text-zinc-500 uppercase">Receita</span>
            </div>

            {/* Despesas bar */}
            <div className="flex flex-col items-center space-y-2 w-16">
              <div className="text-[10px] font-bold font-mono text-rose-400">
                R$ {totalDespesas.toFixed(0)}
              </div>
              <div
                className="w-10 bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-lg transition-all duration-500"
                style={{ height: `${totalDespesas > 0 ? Math.min(120, (totalDespesas / Math.max(totalReceitas, totalDespesas, 1)) * 120) : 4}px` }}
              />
              <span className="text-[9px] font-mono text-zinc-500 uppercase">Despesa</span>
            </div>
          </div>
        </div>

        {/* Categorias */}
        {renderSimpleChart()}
      </div>
    </div>
  );
};
