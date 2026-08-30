import React, { useState } from 'react';
import {
  Landmark,
  ShieldCheck,
  TrendingDown,
  Calculator,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  PieChart,
  DollarSign,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { getCanonicalTransactions, getTotalOpenCardDebt } from '../utils/financialCalculations';

export const CentralFinanceView: React.FC = () => {
  const {
    contracts,
    cards,
    bankAccounts,
    transactions,
    goals,
    openPayContractModal,
    setActiveView,
  } = useFinancial();

  // Debt Calculations
  const totalValorContratos = contracts.reduce((acc, c) => acc + c.valorTotal, 0);
  const totalValorPago = contracts.reduce((acc, c) => acc + c.valorPago, 0);
  const totalValorRestanteContratos = contracts.reduce((acc, c) => acc + c.valorRestante, 0);
  const canonicalTransactions = getCanonicalTransactions(transactions);
  const totalCartoesUtilizado = getTotalOpenCardDebt(canonicalTransactions, cards);

  const dividaTotal = totalValorRestanteContratos + totalCartoesUtilizado;
  const valorQuitado = totalValorPago;
  const valorRestante = dividaTotal;

  // Total Income (Receitas)
  const totalReceitaMensal = canonicalTransactions
    .filter((tx) => tx.tipo === 'RECEITA' && tx.status === 'PAGO')
    .reduce((acc, tx) => acc + tx.valor, 0);
  const incomeMonths = new Set(canonicalTransactions.filter((tx) => tx.tipo === 'RECEITA' && tx.status === 'PAGO').map((tx) => tx.data.slice(0, 7))).size || 1;
  const receitaMensalMedia = totalReceitaMensal / incomeMonths;

  // Total Debt Payment Monthly
  const totalParcelasMensais = contracts.reduce((acc, c) => acc + c.valorParcelaMensal, 0);

  // DTI (Debt to Income ratio / Comprometimento da Renda)
  const comprometimentoRenda = receitaMensalMedia > 0
    ? Math.round((totalParcelasMensais / receitaMensalMedia) * 100)
    : 0;

  // Bank Balances Total
  const totalSaldosBancarios = bankAccounts.reduce((acc, b) => acc + b.saldo, 0);
  const patrimônioLiquido = totalSaldosBancarios - dividaTotal;

  // Interactive payoff slider state
  const [aporteExtra, setAporteExtra] = useState<number>(5000);

  // Simulation calculations
  const jurosMedios = contracts.length ? contracts.reduce((sum, contract) => sum + contract.taxaJurosAnual, 0) / contracts.length : 0;
  const mesesNormaisRestantes = contracts.length ? Math.max(...contracts.map((contract) => contract.parcelasTotal - contract.parcelasPagas)) : 0;
  const economiaEstimadaJuros = Math.round(aporteExtra * (jurosMedios / 100) * (mesesNormaisRestantes / 12));
  const mesesReduzidos = totalParcelasMensais > 0 ? Math.min(mesesNormaisRestantes, Math.round(aporteExtra / totalParcelasMensais * mesesNormaisRestantes)) : 0;
  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + Math.max(0, mesesNormaisRestantes - mesesReduzidos));
  const highestRateContract = [...contracts].sort((a, b) => b.taxaJurosAnual - a.taxaJurosAnual)[0];
  const smallestDebtContract = [...contracts].sort((a, b) => a.valorRestante - b.valorRestante)[0];

  return (
    <div className="p-6 space-y-6 text-zinc-100 font-sans">
      {/* Top Banner Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 border border-amber-500/30 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
            CENTRAL FINANCEIRA & GESTÃO DE PASSIVOS
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-zinc-100">
          Painel de Quitação & Consolidação Patrimonial
        </h2>
        <p className="text-xs text-zinc-400 max-w-2xl">
          Controle unificado de dívidas, financiamentos, empréstimos, carnês e projeção acelerada de amortização.
        </p>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Dívida Total */}
        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-red-500/30 shadow-lg space-y-2">
          <span className="text-xs font-medium text-zinc-400">Dívida Total para Quitação</span>
          <div className="text-xl font-black font-mono text-red-400">
            R$ {dividaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-500 font-mono block">
            Contratos: R$ {totalValorRestanteContratos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-zinc-500 font-mono block">
            Cartões e parcelas futuras: R$ {totalCartoesUtilizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Valor Quitado */}
        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-emerald-500/30 shadow-lg space-y-2">
          <span className="text-xs font-medium text-zinc-400">Valor Já Quitado</span>
          <div className="text-xl font-black font-mono text-emerald-400">
            R$ {valorQuitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-500 font-mono">
            {((valorQuitado / (totalValorContratos || 1)) * 100).toFixed(1)}% amortizado
          </span>
        </div>

        {/* Comprometimento da Renda */}
        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/30 shadow-lg space-y-2">
          <span className="text-xs font-medium text-zinc-400">Comprometimento da Renda</span>
          <div className="text-xl font-black font-mono text-amber-400">
            {comprometimentoRenda}%
          </div>
          <span className="text-[11px] text-zinc-400">
            Parcela mensal: R$ {totalParcelasMensais.toLocaleString('pt-BR')}
          </span>
        </div>

        {/* Patrimônio Líquido */}
        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/30 shadow-lg space-y-2">
          <span className="text-xs font-medium text-zinc-400">Patrimônio Líquido Ajustado</span>
          <div className="text-xl font-black font-mono text-zinc-100">
            R$ {patrimônioLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">
            Solvência excelente
          </span>
        </div>
      </div>

      {/* Interactive Payoff Simulator Card */}
      <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/30 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Simulador Interativo de Quitação Antecipada
              </h3>
              <p className="text-xs text-zinc-400">
                Calcule o impacto do aporte extra mensal na redução do prazo e economia de juros
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('quitacao')}
            className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Simulador Avançado</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Slider */}
        <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-300 font-bold">Aporte Extra Mensal Simulado:</span>
            <span className="text-base font-mono font-black text-amber-400">
              R$ {aporteExtra.toLocaleString('pt-BR')} / mês
            </span>
          </div>

          <input
            type="range"
            min="1000"
            max="30000"
            step="1000"
            value={aporteExtra}
            onChange={(e) => setAporteExtra(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] text-zinc-400 block">Redução no Prazo Final</span>
              <span className="text-sm font-bold text-amber-400 font-mono">
                -{mesesReduzidos} meses ({Math.round(mesesReduzidos / 12)} anos a menos)
              </span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] text-zinc-400 block">Economia Estimada de Juros</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                R$ {economiaEstimadaJuros.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] text-zinc-400 block">Nova Data de Liquidação</span>
              <span className="text-sm font-bold text-zinc-100 font-mono">
                {mesesNormaisRestantes > 0 ? payoffDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Sem contratos ativos'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Strategies Section: Avalanche vs Bola de Neve */}
      <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-zinc-100">
            Estratégias para Redução de Juros e Quitação
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Avalanche Strategy */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-amber-500/30 hover:border-amber-400/50 transition-all space-y-2">
            <div className="font-bold text-amber-400 text-sm flex items-center justify-between">
              <span>Método Avalanche</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px] font-mono">Recomendado</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Foco prioritário nos contratos com a <strong>maior taxa de juros</strong>{highestRateContract ? `: ${highestRateContract.titulo} (${highestRateContract.taxaJurosAnual}% a.a.)` : '.'} Economiza o máximo de juros no longo prazo.
            </p>
          </div>

          {/* Bola de Neve Strategy */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="font-bold text-zinc-200 text-sm">Método Bola de Neve</div>
            <p className="text-zinc-400 leading-relaxed">
              Quitação acelerada dos saldos de <strong>menor valor absoluto</strong>{smallestDebtContract ? `: ${smallestDebtContract.titulo}` : '.'} Elimina contratos rapidamente e libera fluxo de caixa mensal.
            </p>
          </div>

          {/* Consolidação de Crédito */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
            <div className="font-bold text-zinc-200 text-sm">Consolidação Aureum Private</div>
            <p className="text-zinc-400 leading-relaxed">
              Unificação dos saldos devedores em uma única linha de crédito estruturada com garantia imobiliária, reduzindo a taxa média de 11.2% para 7.8% a.a.
            </p>
          </div>
        </div>
      </div>

      {/* Active Credit Contracts Table */}
      <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-zinc-100">
          Contratos de Financiamento, Empréstimos & Carnês Ativos
        </h3>

        <div className="space-y-3">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="space-y-1">
                <div className="font-bold text-sm text-zinc-100">{contract.titulo}</div>
                <div className="text-xs text-zinc-400 font-mono">
                  {contract.instituicao} • Taxa: <span className="text-amber-400">{contract.taxaJurosAnual}% a.a.</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right font-mono text-xs">
                  <div className="text-zinc-400">Saldo Devedor</div>
                  <div className="font-bold text-amber-400 text-sm">
                    R$ {contract.valorRestante.toLocaleString('pt-BR')}
                  </div>
                </div>

                <button
                  onClick={() => openPayContractModal(contract)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Pagar Parcela (R$ {contract.valorParcelaMensal.toLocaleString()})
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
