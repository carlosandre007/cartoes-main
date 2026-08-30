import React, { useState } from 'react';
import {
  Calculator,
  DollarSign,
  Calendar,
  Sparkles,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
  Flame,
  Snowflake,
  Layers,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { getTotalOpenCardDebt } from '../utils/financialCalculations';

export const QuittatementPlanningView: React.FC = () => {
  const { contracts, cards, transactions } = useFinancial();

  // Debt stats
  const totalContratosRestante = contracts.reduce((acc, c) => acc + c.valorRestante, 0);
  const totalCartoesUtilizado = getTotalOpenCardDebt(transactions, cards);
  const quantoDevo = totalContratosRestante + totalCartoesUtilizado;

  const quantoJaPaguei = contracts.reduce((acc, c) => acc + c.valorPago, 0);
  const quantoFalta = quantoDevo;

  // Interactive Sliders
  const [aporteExtraMensal, setAporteExtraMensal] = useState<number>(0);
  const [aporteUnicoBoleto, setAporteUnicoBoleto] = useState<number>(0);
  const [selectedEstrategia, setSelectedEstrategia] = useState<'AVALANCHE' | 'SNOWBALL' | 'CONSOLIDACAO'>('AVALANCHE');

  // Calculations
  const monthlyDebt = contracts.reduce((sum, contract) => sum + contract.valorParcelaMensal, 0);
  const remainingMonths = contracts.length ? Math.max(...contracts.map((contract) => contract.parcelasTotal - contract.parcelasPagas)) : 0;
  const averageRate = contracts.length ? contracts.reduce((sum, contract) => sum + contract.taxaJurosAnual, 0) / contracts.length : 0;
  const mesesAbreviados = monthlyDebt > 0 ? Math.min(remainingMonths, Math.round(((aporteExtraMensal * remainingMonths) + aporteUnicoBoleto) / monthlyDebt)) : 0;
  const economiaJuros = Math.round((aporteExtraMensal * mesesAbreviados + aporteUnicoBoleto) * averageRate / 100);
  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + Math.max(0, remainingMonths - mesesAbreviados));
  const highestRate = [...contracts].sort((a, b) => b.taxaJurosAnual - a.taxaJurosAnual)[0];
  const smallestDebt = [...contracts].sort((a, b) => a.valorRestante - b.valorRestante)[0];

  return (
    <div className="p-6 space-y-6 text-zinc-100 font-sans">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 border border-amber-500/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              AUREUM DEBT AMORTIZATION ENGINE
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-zinc-100">Simulador de Quitação de Dívidas</h2>
          <p className="text-xs text-zinc-400">
            Simule o efeito de aportes extras e bônus na aceleração da quitação e economia bruta de juros.
          </p>
        </div>
      </div>

      {/* Top Debt Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-red-500/30 shadow-lg space-y-1">
          <span className="text-xs text-zinc-400 block font-medium">Quanto Devo (Total)</span>
          <div className="text-xl font-black font-mono text-red-400">
            R$ {quantoDevo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Passivo bruto consolidado</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-emerald-500/30 shadow-lg space-y-1">
          <span className="text-xs text-zinc-400 block font-medium">Quanto Já Paguei</span>
          <div className="text-xl font-black font-mono text-emerald-400">
            R$ {quantoJaPaguei.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-emerald-500 font-mono">
            {((quantoJaPaguei / (quantoJaPaguei + quantoDevo || 1)) * 100).toFixed(1)}% amortizado
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/30 shadow-lg space-y-1">
          <span className="text-xs text-zinc-400 block font-medium">Quanto Falta</span>
          <div className="text-xl font-black font-mono text-amber-400">
            R$ {quantoFalta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Saldo devedor restante</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-lg space-y-1">
          <span className="text-xs text-zinc-400 block font-medium">Meta Inicial de Quitação</span>
          <div className="text-xl font-black font-mono text-zinc-100">{remainingMonths ? payoffDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Sem contratos'}</div>
          <span className="text-[10px] text-amber-400 font-mono">Prazo contratual padrão</span>
        </div>
      </div>

      {/* Interactive Simulation Sliders */}
      <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/30 shadow-xl space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-zinc-100">
            Controles Interativos de Amortização Antecipada
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Slider 1: Aporte Extra Mensal */}
          <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-zinc-200">Aporte Extra Mensal Reincidente:</span>
              <span className="font-mono text-amber-400 font-bold text-sm">
                R$ {aporteExtraMensal.toLocaleString('pt-BR')} / mês
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="25000"
              step="1000"
              value={aporteExtraMensal}
              onChange={(e) => setAporteExtraMensal(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <span className="text-[11px] text-zinc-400 block">
              Adicionado diretamente às parcelas mensais contratadas
            </span>
          </div>

          {/* Slider 2: Aporte Único Extra */}
          <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-zinc-200">Aporte Único Imediato (Bônus/PLR):</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                R$ {aporteUnicoBoleto.toLocaleString('pt-BR')}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="200000"
              step="5000"
              value={aporteUnicoBoleto}
              onChange={(e) => setAporteUnicoBoleto(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <span className="text-[11px] text-zinc-400 block">
              Aplicado como abate direto de saldo devedor
            </span>
          </div>
        </div>

        {/* Impact Results Panel */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/40 border border-amber-500/30 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-zinc-400 block font-medium">Prazo Economizado</span>
            <div className="text-2xl font-black font-mono text-amber-400">
              -{mesesAbreviados} meses
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              Quitação prevista em <strong>{payoffDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-zinc-400 block font-medium">Economia Bruta de Juros</span>
            <div className="text-2xl font-black font-mono text-emerald-400">
              R$ {economiaJuros.toLocaleString('pt-BR')}
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              Juros não pagos à instituição
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-zinc-400 block font-medium">Eficiência da Amortização</span>
            <div className="text-2xl font-black font-mono text-zinc-100">
              {averageRate.toFixed(1)}% a.a.
            </div>
            <span className="text-[11px] text-emerald-400 font-mono">
              Taxa média dos contratos
            </span>
          </div>
        </div>
      </div>

      {/* Strategies Selection */}
      <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-zinc-100">
          Escolha a Estratégia de Quitação Preferencial
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Avalanche */}
          <div
            onClick={() => setSelectedEstrategia('AVALANCHE')}
            className={`p-5 rounded-xl border cursor-pointer transition-all ${
              selectedEstrategia === 'AVALANCHE'
                ? 'bg-amber-500/10 border-amber-400 text-amber-200'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-amber-400 text-sm mb-2">
              <Flame className="w-4 h-4" /> Método Avalanche
            </div>
            <p className="text-[11px] leading-relaxed">
              Ataca o contrato com a <strong>maior taxa de juros</strong> primeiro{highestRate ? ` (${highestRate.titulo}, ${highestRate.taxaJurosAnual}% a.a.)` : ''}. Maximiza a economia financeira.
            </p>
          </div>

          {/* Snowball */}
          <div
            onClick={() => setSelectedEstrategia('SNOWBALL')}
            className={`p-5 rounded-xl border cursor-pointer transition-all ${
              selectedEstrategia === 'SNOWBALL'
                ? 'bg-amber-500/10 border-amber-400 text-amber-200'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-blue-400 text-sm mb-2">
              <Snowflake className="w-4 h-4" /> Método Bola de Neve
            </div>
            <p className="text-[11px] leading-relaxed">
              Elimina o saldo devedor de <strong>menor valor absoluto</strong> primeiro{smallestDebt ? ` (${smallestDebt.titulo})` : ''}. Libera parcelas mais rapidamente.
            </p>
          </div>

          {/* Consolidacao */}
          <div
            onClick={() => setSelectedEstrategia('CONSOLIDACAO')}
            className={`p-5 rounded-xl border cursor-pointer transition-all ${
              selectedEstrategia === 'CONSOLIDACAO'
                ? 'bg-amber-500/10 border-amber-400 text-amber-200'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm mb-2">
              <Layers className="w-4 h-4" /> Consolidação Aureum
            </div>
            <p className="text-[11px] leading-relaxed">
              Substitui todas as dívidas pulverizadas por um único contrato de crédito estruturado Aureum com taxa reduzida unificada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
