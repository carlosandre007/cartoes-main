import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Landmark,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calculator,
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Edit2,
  Trash2,
  BrainCircuit,
  BarChart3,
  Building2,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { getMonthlyCommitments } from '../utils/monthlyCommitments';
import { getCanonicalTransactions, getConsolidatedFlowItems, getTotalOpenCardDebt, getTotalFinancingDebt, getTotalFixedCostDebt } from '../utils/financialCalculations';
import { buildFinancialIntelligenceSummary, generateLocalFinancialAnalysis, parseFinancialNumber } from '../utils/financialIntelligence';

export const DashboardView: React.FC = () => {
  const {
    transactions,
    bankAccounts,
    contracts,
    cards,
    goals,
    setActiveView,
    openNewTransactionModal,
    openPayContractModal,
    toggleTransactionStatus,
    payCardInvoice,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useFinancial();

  const [companyRevenueByMonth, setCompanyRevenueByMonth] = React.useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('aureum_company_revenue_by_month') || '{}'); }
    catch { return {}; }
  });

  React.useEffect(() => {
    localStorage.setItem('aureum_company_revenue_by_month', JSON.stringify(companyRevenueByMonth));
  }, [companyRevenueByMonth]);

  const handleAddCompanyRevenue = () => {
    const month = prompt('Competência do faturamento (AAAA-MM):', new Date().toISOString().slice(0, 7))?.trim();
    if (!month || !/^\d{4}-\d{2}$/.test(month)) { alert('Informe a competência no formato AAAA-MM.'); return; }
    const informed = prompt('Faturamento total da empresa no mês (R$):', String(companyRevenueByMonth[month] || 0));
    if (informed === null) return;
    const value = parseFinancialNumber(informed);
    if (!Number.isFinite(value) || value <= 0) { alert('Informe um faturamento maior que zero.'); return; }
    setCompanyRevenueByMonth((previous) => ({ ...previous, [month]: value }));
  };

  const handleAddGoal = () => {
    const titulo = prompt('Título da meta:')?.trim();
    if (!titulo) return;
    const valorAlvo = Number(prompt('Valor-alvo (R$):', '0')?.replace(',', '.'));
    if (!Number.isFinite(valorAlvo) || valorAlvo <= 0) return;
    const valorAtual = Number(prompt('Valor atual (R$):', '0')?.replace(',', '.')) || 0;
    addGoal({
      titulo,
      categoria: prompt('Categoria:', 'Objetivo financeiro')?.trim() || 'Objetivo financeiro',
      valorAlvo,
      valorAtual: Math.max(0, valorAtual),
      dataLimite: prompt('Data-limite (AAAA-MM-DD):', '')?.trim() || '',
      corIcone: 'text-amber-400',
    });
  };

  const handleEditGoal = (id: string, currentValue: number) => {
    const value = Number(prompt('Novo valor acumulado (R$):', String(currentValue))?.replace(',', '.'));
    if (Number.isFinite(value) && value >= 0) updateGoal(id, { valorAtual: value });
  };

  const handleFinancialAnalysis = () => {
    const suggestedBalance = bankAccounts.reduce((sum, account) => sum + account.saldo, 0);
    const informed = prompt('Informe seu saldo atual para a análise (R$):', suggestedBalance.toFixed(2));
    if (informed === null) return;
    const value = parseFinancialNumber(informed);
    if (!Number.isFinite(value)) { alert('Informe um saldo válido.'); return; }
    sessionStorage.setItem('aureum_ai_balance', String(value));
    sessionStorage.setItem('aureum_ai_request', '1');
    setActiveView('inteligencia');
  };

  // Calculate totals
  const totalBankBalance = bankAccounts.reduce((acc, b) => acc + b.saldo, 0);

  // Current month income & expenses
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const canonicalTransactions = getCanonicalTransactions(transactions);
  const consolidatedFlow = getConsolidatedFlowItems(canonicalTransactions, cards);
  const currentMonthTxs = consolidatedFlow.filter((tx) => tx.data.startsWith(currentMonthStr));

  const totalReceitasMes = currentMonthTxs
    .filter((tx) => tx.tipo === 'RECEITA' && tx.status === 'PAGO')
    .reduce((acc, tx) => acc + tx.valor, 0);

  const totalDespesasMes = currentMonthTxs
    .filter((tx) => tx.tipo === 'DESPESA' && tx.status === 'PAGO')
    .reduce((acc, tx) => acc + tx.valor, 0);

  const totalDespesasPendentesMes = currentMonthTxs
    .filter((tx) => tx.tipo === 'DESPESA' && tx.status !== 'PAGO')
    .reduce((acc, tx) => acc + tx.valor, 0);

  const resultadoLiquidoMes = totalReceitasMes - totalDespesasMes;

  // Debt statistics
  const totalDividaContratos = getTotalFinancingDebt(canonicalTransactions, contracts);
  // Mantém o Dashboard consistente com a tela de Cartões: considera todas as
  // faturas e parcelas abertas, não apenas a competência do mês atual.
  const totalDividaCartoes = getTotalOpenCardDebt(canonicalTransactions, cards);
  const dividaTotal = totalDividaContratos + totalDividaCartoes;
  const totalLimiteUtilizadoCartoes = totalDividaCartoes;
  const totalDividaCustosFixos = getTotalFixedCostDebt(canonicalTransactions, now);
  const totalDebitosUnificado = totalLimiteUtilizadoCartoes + totalDividaContratos + totalDividaCustosFixos;
  const faturamentoEmpresaMes = companyRevenueByMonth[currentMonthStr] || 0;

  const totalValorPagoContratos = contracts.reduce((acc, c) => acc + c.valorPago, 0);
  const valorTotalContratos = contracts.reduce((acc, c) => acc + c.valorTotal, 0);

  const currentMonthLabel = now.toLocaleDateString('pt-BR', { month: 'long' });
  const futureMonthKeys = Array.from(new Set([
    currentMonthStr,
    ...consolidatedFlow.filter((tx) => tx.data.slice(0, 7) >= currentMonthStr).map((tx) => tx.data.slice(0, 7)),
  ])).sort().slice(0, 6);
  const monthlyChart = futureMonthKeys.map((key) => {
    const [year, month] = key.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const monthTransactions = consolidatedFlow.filter(
      (tx) => tx.data.startsWith(key) && (tx.origemFinanceira !== 'CUSTO_FIXO' || key === currentMonthStr)
    );
    return {
      mes: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      receita: monthTransactions.filter((tx) => tx.tipo === 'RECEITA').reduce((sum, tx) => sum + tx.valor, 0),
      despesa: monthTransactions.filter((tx) => tx.tipo === 'DESPESA').reduce((sum, tx) => sum + tx.valor, 0),
    };
  });
  const chartMax = Math.max(1, ...monthlyChart.flatMap((month) => [month.receita, month.despesa]));
  const debtEvolution = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const total = consolidatedFlow
      .filter((tx) => tx.tipo === 'DESPESA' && tx.status !== 'CANCELADO' && tx.data.startsWith(key))
      .filter((tx) => tx.origemFinanceira !== 'CUSTO_FIXO' || key === currentMonthStr)
      .reduce((sum, tx) => sum + tx.valor, 0);
    return { key, label: date.toLocaleDateString('pt-BR', { month: 'short' }), total };
  });
  const debtEvolutionMax = Math.max(1, ...debtEvolution.map((item) => item.total));
  const previousMonthDebt = debtEvolution.at(-2)?.total || 0;
  const currentMonthDebt = debtEvolution.at(-1)?.total || 0;
  const debtTrend = currentMonthDebt - previousMonthDebt;

  // Upcoming due dates (next pending despesas)
  const proximosVencimentos = getMonthlyCommitments(canonicalTransactions, cards, now).slice(0, 5);

  const limiteAlertaCustoFixo = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
  const alertasCustosFixos = transactions
    .filter(
      (tx) =>
        tx.origemFinanceira === 'CUSTO_FIXO' &&
        tx.tipo === 'DESPESA' &&
        tx.status !== 'PAGO'
    )
    .filter((tx) => {
      const vencimento = new Date(`${tx.data}T00:00:00`);
      return !Number.isNaN(vencimento.getTime()) && vencimento <= limiteAlertaCustoFixo;
    })
    .sort((a, b) => a.data.localeCompare(b.data));

  const dailyConsultant = React.useMemo(() => generateLocalFinancialAnalysis(buildFinancialIntelligenceSummary({
    transactions, cards, contracts, bankAccounts, goals, currentBalanceInformed: totalBankBalance,
  })), [transactions, cards, contracts, bankAccounts, goals, totalBankBalance]);

  return (
    <div className="p-6 space-y-6 text-zinc-100 font-sans">
      {/* Top Welcome & Quick Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 border border-amber-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-amber-400 font-semibold uppercase tracking-wider">
              AUREUM PRIVATE BANKING • PAINEL EXECUTIVO
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-zinc-100 font-sans tracking-tight">
            Visão geral financeira
          </h2>
          <p className="text-xs text-zinc-400">
            Seu fluxo financeiro está unificado. {proximosVencimentos.length} compromissos pendentes este mês.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleFinancialAnalysis}
            className="flex-1 md:flex-none px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-violet-500/30 text-violet-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Analisar Minha Situação Financeira</span>
          </button>
          <button
            onClick={() => openNewTransactionModal()}
            className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Lançamento</span>
          </button>
          <button
            onClick={() => setActiveView('quitacao')}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Simular Quitação</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Consolidado */}
        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/20 hover:border-amber-500/40 transition-all shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Saldo Consolidado</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-zinc-100">
            R$ {totalBankBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{bankAccounts.length} {bankAccounts.length === 1 ? 'conta cadastrada' : 'contas cadastradas'}</span>
          </div>
        </div>

        {/* Receita do Mês */}
        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Receitas ({currentMonthLabel})</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-emerald-400">
            R$ {totalReceitasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">Total recebido e realizado no mês</div>
        </div>

        {/* Despesas do Mês */}
        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/20 hover:border-amber-500/40 transition-all shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Despesas ({currentMonthLabel})</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-amber-400">
            R$ {totalDespesasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            Realizado • Pendente: R$ {totalDespesasPendentesMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Dívida Total Restante */}
        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-red-500/20 hover:border-red-500/40 transition-all shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Passivo / Dívida Total</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-red-400">
            R$ {dividaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-400">
            {((totalValorPagoContratos / (valorTotalContratos || 1)) * 100).toFixed(1)}% amortizado
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-950/30 via-zinc-950 to-amber-950/20 border border-violet-500/25 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-violet-400" /> Consultor Financeiro Diário</h3>
            <p className="text-[11px] text-zinc-400">Calculado localmente e atualizado automaticamente com seus dados reais.</p>
          </div>
          <button onClick={() => setActiveView('inteligencia')} className="px-3 py-2 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-bold cursor-pointer">Abrir análise completa</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800"><span className="text-[10px] text-zinc-500 block">Saúde financeira</span><strong className="text-lg text-amber-400">{dailyConsultant.score}/100</strong><span className="text-[10px] text-zinc-400 block">{dailyConsultant.classification}</span></div>
          <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800"><span className="text-[10px] text-zinc-500 block">Prioridade do dia</span><p className="text-xs text-zinc-200 mt-1">{dailyConsultant.priority}</p></div>
          <div className="p-3 rounded-xl bg-zinc-900/70 border border-red-500/20"><span className="text-[10px] text-red-400 block">Principal alerta</span><p className="text-xs text-zinc-200 mt-1">{dailyConsultant.alert}</p></div>
          <div className="p-3 rounded-xl bg-zinc-900/70 border border-emerald-500/20"><span className="text-[10px] text-emerald-400 block">Melhor oportunidade</span><p className="text-xs text-zinc-200 mt-1">{dailyConsultant.opportunity}</p></div>
          <div className="p-3 rounded-xl bg-zinc-900/70 border border-amber-500/20"><span className="text-[10px] text-amber-400 block">Vencimento crítico</span><p className="text-xs text-zinc-200 mt-1">{dailyConsultant.nextCriticalDue}</p></div>
        </div>
      </div>

      {/* Unified debt center */}
      <div className="p-6 rounded-2xl bg-zinc-950/90 border border-red-500/25 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-red-400" /> Central Unificada de Débitos</h3>
            <p className="text-xs text-zinc-400">Cartões utilizados, saldo dos financiamentos e custos fixos. Quando há data de término, todas as parcelas devidas até o fim entram no total. O faturamento é apenas informativo.</p>
          </div>
          <button onClick={handleAddCompanyRevenue} className="px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer">
            <Building2 className="w-4 h-4" /> Adicionar/atualizar faturamento
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            ['Limite utilizado dos cartões', totalLimiteUtilizadoCartoes, 'text-amber-400'],
            ['Financiamentos a quitar', totalDividaContratos, 'text-red-400'],
            ['Dívida de custos fixos', totalDividaCustosFixos, 'text-orange-400'],
            ['Faturamento da empresa', faturamentoEmpresaMes, 'text-emerald-400'],
            ['Total unificado de débitos', totalDebitosUnificado, 'text-red-300'],
          ].map(([label, value, color]) => (
            <div key={String(label)} className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block min-h-8">{label}</span>
              <strong className={`text-base font-black font-mono ${color}`}>R$ {(value as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-200">Evolução mensal dos débitos</span>
            <span className={debtTrend <= 0 ? 'text-emerald-400' : 'text-red-400'}>{debtTrend <= 0 ? 'Diminuiu' : 'Aumentou'} R$ {Math.abs(debtTrend).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em relação ao mês anterior</span>
          </div>
          <div className="grid grid-cols-6 gap-2 h-36 items-end">
            {debtEvolution.map((item) => (
              <div key={item.key} className="h-full flex flex-col justify-end items-center gap-1 min-w-0">
                <span className="text-[9px] text-zinc-400 font-mono truncate w-full text-center">R$ {item.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                <div style={{ height: `${Math.max(item.total ? 8 : 2, (item.total / debtEvolutionMax) * 100)}%` }} className="w-full max-w-12 rounded-t-md bg-gradient-to-t from-red-700 to-amber-500" />
                <span className="text-[10px] text-zinc-500 uppercase">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Cash Flow & Debt Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fluxo de Caixa Bar Visualization */}
          <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">
                  Fluxo Financeiro Consolidado
                </h3>
                <p className="text-xs text-zinc-400">
                  Entradas e saídas previstas do mês atual em diante
                </p>
              </div>
              <button
                onClick={() => setActiveView('fluxo')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Tabela Completa</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Chart Bars */}
            <div className="space-y-4 pt-2">
              {monthlyChart.map((item, idx) => {
                const recPct = Math.min(100, (item.receita / chartMax) * 100);
                const despPct = Math.min(100, (item.despesa / chartMax) * 100);

                return (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-zinc-300 font-mono">
                      <span className="font-sans font-bold">{item.mes}</span>
                      <span className="text-[11px] text-zinc-400">
                        Entrada: <strong className="text-emerald-400">R$ {item.receita.toLocaleString()}</strong> | Saída:{' '}
                        <strong className="text-amber-400">R$ {item.despesa.toLocaleString()}</strong>
                      </span>
                    </div>

                    <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-zinc-800">
                      <div
                        style={{ width: `${recPct}%` }}
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        title={`Receita: R$ ${item.receita}`}
                      />
                      <div
                        style={{ width: `${despPct}%` }}
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        title={`Despesa: R$ ${item.despesa}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Resultado Líquido do Mês:</span>
              <span
                className={`font-mono font-black text-sm ${
                  resultadoLiquidoMes >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {resultadoLiquidoMes >= 0 ? '+' : ''} R${' '}
                {resultadoLiquidoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Dívida Total e Progresso de Quitação */}
          <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">
                  Progresso Global de Amortização das Dívidas
                </h3>
                <p className="text-xs text-zinc-400">
                  Status de pagamentos dos contratos de financiamento, empréstimos e carnês
                </p>
              </div>
              <button
                onClick={() => setActiveView('credito')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Carteira</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Contracts List with Progress Bar */}
            <div className="space-y-4">
              {contracts.map((contract) => {
                const pct = Math.round((contract.valorPago / contract.valorTotal) * 100);

                return (
                  <div
                    key={contract.id}
                    className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-xs text-zinc-200">{contract.titulo}</div>
                        <div className="text-[11px] text-zinc-400">{contract.instituicao}</div>
                      </div>
                      <button
                        onClick={() => openPayContractModal(contract)}
                        className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-[11px] rounded-lg transition-colors cursor-pointer"
                      >
                        Pagar Parcela
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-zinc-400">
                          Quitado: R$ {contract.valorPago.toLocaleString('pt-BR')} ({pct}%)
                        </span>
                        <span className="text-amber-400 font-semibold">
                          Falta: R$ {contract.valorRestante.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Próximos Vencimentos & Goals */}
        <div className="space-y-6">
          {alertasCustosFixos.length > 0 && (
            <div className="p-5 rounded-2xl bg-red-950/30 border border-red-500/40 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Alerta de Custos Fixos
              </h3>
              <p className="text-[11px] text-zinc-400">Vencidos ou com vencimento nos próximos 3 dias.</p>
              <div className="space-y-2">
                {alertasCustosFixos.map((tx) => (
                  <div key={tx.id} className="p-3 rounded-xl bg-zinc-950/70 border border-red-500/20 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-zinc-100 truncate">{tx.descricao}</div>
                      <div className="text-[10px] text-red-300 font-mono">Vence: {tx.data}</div>
                    </div>
                    <button
                      onClick={() => toggleTransactionStatus(tx.id)}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold"
                    >
                      Pago
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Próximos Vencimentos */}
          <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Próximos Vencimentos
              </h3>
              <button
                onClick={() => setActiveView('calendario')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                Calendário
              </button>
            </div>

            <div className="space-y-3">
              {proximosVencimentos.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500">
                  Nenhum compromisso pendente.
                </div>
              ) : (
                proximosVencimentos.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-semibold text-zinc-200 line-clamp-1">
                        {tx.kind === 'CARD_INVOICE' ? `Cartão ${tx.title}` : tx.title}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        Vence: <span className="text-amber-400">{tx.date}</span> • {tx.category}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono text-amber-400">
                        R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      {tx.transactionId ? (
                        <button
                          onClick={() => toggleTransactionStatus(tx.transactionId!)}
                          className="text-[10px] text-emerald-400 hover:underline font-semibold"
                        >
                          Marcar Pago
                        </button>
                      ) : tx.cardId ? (
                        <button
                          onClick={() => payCardInvoice(tx.cardId!)}
                          className="text-[10px] text-emerald-400 hover:underline font-semibold"
                        >
                          Marcar Pago
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Metas Financeiras */}
          <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Metas & Objetivos Aureum
              </h3>
              <button onClick={handleAddGoal} className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                <Plus className="w-3 h-3" /> Nova meta
              </button>
            </div>

            <div className="space-y-3">
              {goals.map((goal) => {
                const goalPct = Math.min(
                  100,
                  Math.round((goal.valorAtual / goal.valorAlvo) * 100)
                );

                return (
                  <div
                    key={goal.id}
                    className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2"
                  >
                    <div className="flex justify-between items-start text-xs">
                      <span className="font-bold text-zinc-200">{goal.titulo}</span>
                      <span className="font-mono text-amber-400 font-bold">{goalPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${goalPct}%` }}
                        className="h-full bg-amber-400 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                      <span>R$ {goal.valorAtual.toLocaleString('pt-BR')}</span>
                      <span>Meta: R$ {goal.valorAlvo.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button onClick={() => handleEditGoal(goal.id, goal.valorAtual)} className="text-zinc-500 hover:text-amber-400" title="Atualizar meta">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => confirm('Excluir esta meta?') && deleteGoal(goal.id)} className="text-zinc-500 hover:text-red-400" title="Excluir meta">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
