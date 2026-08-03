import React from 'react';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Award,
  Zap,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

export const FinancialHealthView: React.FC = () => {
  const { transactions, bankAccounts, contracts, cards } = useFinancial();

  // Metrics
  const totalReceitas = transactions
    .filter((tx) => tx.tipo === 'RECEITA' && tx.status === 'PAGO')
    .reduce((acc, tx) => acc + tx.valor, 0);

  const totalDespesas = transactions
    .filter((tx) => tx.tipo === 'DESPESA' && tx.status === 'PAGO')
    .reduce((acc, tx) => acc + tx.valor, 0);

  const totalSaldos = bankAccounts.reduce((acc, b) => acc + b.saldo, 0);
  const totalParcelasMensais = contracts.reduce((acc, c) => acc + c.valorParcelaMensal, 0);

  // Health Metrics
  const savingsRate = totalReceitas > 0
    ? Math.round(((totalReceitas - totalDespesas) / totalReceitas) * 100)
    : 0;

  const dti = totalReceitas > 0
    ? Math.round((totalParcelasMensais / totalReceitas) * 100)
    : 0;

  const activeMonths = new Set(transactions.filter((tx) => tx.status === 'PAGO').map((tx) => tx.data.slice(0, 7))).size || 1;
  const despesaMensalMedia = totalDespesas / activeMonths;
  const mesesCobertura = despesaMensalMedia > 0 ? totalSaldos / despesaMensalMedia : 0;
  const mesesCoberturaEmergencia = mesesCobertura.toFixed(1);
  const totalDividas = contracts.reduce((sum, contract) => sum + contract.valorRestante, 0) + cards.reduce((sum, card) => sum + card.limiteUtilizado, 0);
  const leverage = totalSaldos > 0 ? Math.round((totalDividas / totalSaldos) * 100) : totalDividas > 0 ? 100 : 0;
  const healthScore = transactions.length === 0 && bankAccounts.length === 0
    ? 0
    : Math.round(Math.max(0, Math.min(1000, 500 + savingsRate * 5 - dti * 4 + Math.min(200, mesesCobertura * 25) - leverage)));
  const scoreOffset = 376 - (376 * healthScore / 1000);
  const healthLevel = healthScore >= 800 ? 'EXCELENTE' : healthScore >= 600 ? 'BOA' : healthScore >= 400 ? 'ATENÇÃO' : 'CRÍTICA';
  const highestRateContract = [...contracts].sort((a, b) => b.taxaJurosAnual - a.taxaJurosAnual)[0];

  return (
    <div className="p-6 space-y-6 text-zinc-100 font-sans">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 border border-amber-500/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
              AUREUM HEALTH SCORE • DIAGNÓSTICO PATRIMONIAL
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-zinc-100">Saúde Financeira & Indicadores</h2>
          <p className="text-xs text-zinc-400">
            Análise preditiva de liquidez, risco de endividamento e eficiência patrimonial.
          </p>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/40 border border-amber-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          {/* Gauge Ring */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="60"
                stroke="currentColor"
                strokeWidth="12"
                className="text-zinc-800"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="60"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray="376"
                strokeDashoffset={scoreOffset}
                className="text-amber-400"
                fill="transparent"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <div className="text-2xl font-black font-mono text-amber-400">{healthScore}</div>
              <div className="text-[10px] text-zinc-400 font-mono uppercase">/ 1000</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-xs font-bold inline-block">
              NÍVEL {healthLevel}
            </div>
            <h3 className="text-lg font-bold text-zinc-100">Diagnóstico calculado pelo fluxo financeiro</h3>
            <p className="text-xs text-zinc-400 max-w-md">
              Sua estrutura de capital apresenta alta liquidez e cobertura de caixa de {mesesCoberturaEmergencia} meses de despesas.
            </p>
          </div>
        </div>

        <div className="w-full md:w-auto p-4 rounded-xl bg-zinc-900/80 border border-amber-500/20 space-y-2 text-xs">
          <div className="flex justify-between gap-6">
            <span className="text-zinc-400">Grau de Alavancagem:</span>
            <span className="font-bold text-emerald-400">{leverage}%</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-zinc-400">Liquidez Imediata:</span>
            <span className="font-bold text-amber-400">R$ {totalSaldos.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-zinc-400">Taxa de Poupança:</span>
            <span className="font-bold text-emerald-400">{savingsRate}% / mês</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            DTI (Debt-To-Income)
          </span>
          <div className="text-2xl font-black font-mono text-amber-400">{dti}%</div>
          <p className="text-xs text-zinc-400">
            Ideal é permanecer abaixo de 30%. Suas parcelas mensais consomem {dti}% da sua renda.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-950/90 border border-emerald-500/20 shadow-xl space-y-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Taxa de Poupança / Aporte
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400">{savingsRate}%</div>
          <p className="text-xs text-zinc-400">
            Você está reinvestindo ou acumulando {savingsRate}% de cada receita bruta que entra.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Reserva de Emergência
          </span>
          <div className="text-2xl font-black font-mono text-zinc-100">
            {mesesCoberturaEmergencia} meses
          </div>
          <p className="text-xs text-zinc-400">
            Caixa suficiente para cobrir {mesesCoberturaEmergencia} meses de custos fixos sem novas receitas.
          </p>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Recomendações Estratégicas Aureum AI
        </h3>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-zinc-200">Prioridade de amortização</div>
              <p className="text-zinc-400 leading-relaxed mt-1">
                {highestRateContract
                  ? `Direcione aportes extras primeiro para “${highestRateContract.titulo}”, que possui a maior taxa cadastrada (${highestRateContract.taxaJurosAnual}% a.a.).`
                  : 'Cadastre contratos de crédito para receber uma recomendação de amortização baseada nas taxas reais.'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-amber-500/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-zinc-200">Otimização de Custos Fixos Recorrentes</div>
              <p className="text-zinc-400 leading-relaxed mt-1">
                {despesaMensalMedia > 0
                  ? `As despesas pagas registradas apresentam média mensal de R$ ${despesaMensalMedia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Revise os maiores custos recorrentes no Fluxo de Caixa.`
                  : 'Cadastre despesas recorrentes para identificar oportunidades reais de redução de custos.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
