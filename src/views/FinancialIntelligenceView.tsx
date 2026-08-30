import React, { useEffect, useState } from 'react';
import { BrainCircuit, History, LoaderCircle, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { buildFinancialIntelligenceSummary, parseFinancialNumber } from '../utils/financialIntelligence';
import { FinancialAnalysisRecord, loadFinancialAnalyses, requestFinancialAnalysis, saveFinancialAnalysis } from '../lib/financialIntelligence';

export const FinancialIntelligenceView: React.FC = () => {
  const { transactions, cards, contracts, bankAccounts, goals } = useFinancial();
  const { user } = useAuth();
  const historyOwner = user?.id || 'local';
  const [balance, setBalance] = useState(() => sessionStorage.getItem('aureum_ai_balance') || String(bankAccounts.reduce((sum, account) => sum + account.saldo, 0)));
  const [history, setHistory] = useState<FinancialAnalysisRecord[]>([]);
  const [selected, setSelected] = useState<FinancialAnalysisRecord | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadFinancialAnalyses(historyOwner).then((records) => { setHistory(records); setSelected(records[0] || null); });
  }, [historyOwner]);

  const analyze = async () => {
    if (processing) return;
    const informed = parseFinancialNumber(balance);
    if (!Number.isFinite(informed)) { setError('Informe um saldo atual válido.'); return; }
    setProcessing(true); setError('');
    try {
      const summary = buildFinancialIntelligenceSummary({ transactions, cards, contracts, bankAccounts, goals, currentBalanceInformed: informed });
      const analysis = await requestFinancialAnalysis(summary);
      const record = await saveFinancialAnalysis(historyOwner, summary, analysis);
      setHistory((records) => [record, ...records.filter((item) => item.createdAt.slice(0, 10) !== record.createdAt.slice(0, 10))]);
      setSelected(record);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível gerar a análise.');
    } finally { setProcessing(false); sessionStorage.removeItem('aureum_ai_request'); }
  };

  useEffect(() => {
    if (sessionStorage.getItem('aureum_ai_request') === '1' && !processing) {
      sessionStorage.removeItem('aureum_ai_request');
      void analyze();
    }
    // A execução automática ocorre exclusivamente como continuação do clique na Dashboard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyOwner]);

  useEffect(() => {
    const timer = window.setTimeout(() => { if (!processing) void analyze(); }, 300);
    return () => window.clearTimeout(timer);
    // Recalcula após qualquer alteração financeira relevante.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, cards, contracts, bankAccounts, goals]);

  const previous = selected ? history[history.findIndex((item) => item.id === selected.id) + 1] : undefined;
  const debtDelta = selected && previous ? selected.summary.totals.totalDebt - previous.summary.totals.totalDebt : null;
  const netWorthDelta = selected && previous ? selected.summary.totals.netWorth - previous.summary.totals.netWorth : null;

  return (
    <div className="p-6 space-y-6 text-zinc-100">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 border border-amber-500/30 shadow-xl flex flex-col lg:flex-row justify-between gap-4">
        <div><div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase"><BrainCircuit className="w-5 h-5" /> Central de Inteligência Financeira</div><h2 className="text-xl font-extrabold mt-2">Motor financeiro local</h2><p className="text-xs text-zinc-400 mt-1">Análise automática por indicadores e regras locais. Sem IA externa, APIs ou custos mensais.</p></div>
        <div className="flex flex-col sm:flex-row items-end gap-2">
          <label className="text-[11px] text-zinc-400">Saldo atual informado<input value={balance} onChange={(event) => setBalance(event.target.value)} type="text" inputMode="text" placeholder="Ex: -1.234,56" className="block mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100" /></label>
          <button disabled={processing} onClick={() => void analyze()} className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 disabled:opacity-60 text-zinc-950 font-extrabold text-xs rounded-xl flex items-center gap-2">
            {processing ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}{processing ? 'Recalculando...' : 'Recalcular agora'}
          </button>
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300 text-xs">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
          <h3 className="text-xs font-bold flex items-center gap-2"><History className="w-4 h-4 text-amber-400" /> Histórico de análises</h3>
          {history.length === 0 ? <p className="text-xs text-zinc-500 py-6 text-center">Nenhuma análise realizada.</p> : history.map((record) => (
            <button key={record.id} onClick={() => setSelected(record)} className={`w-full text-left p-3 rounded-xl border text-xs ${selected?.id === record.id ? 'border-amber-500/40 bg-amber-500/10' : 'border-zinc-800 bg-zinc-900/50'}`}>
              <span className="text-zinc-200 block">{new Date(record.createdAt).toLocaleString('pt-BR')}</span><span className="text-amber-400 font-mono">Nota: {record.score ?? '—'}/100</span>
            </button>
          ))}
        </aside>

        <section className="lg:col-span-3 space-y-4">
          {selected ? <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800"><span className="text-[11px] text-zinc-400">Nota financeira</span><div className="text-xl font-black text-amber-400">{selected.score ?? '—'}/100</div></div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800"><span className="text-[11px] text-zinc-400">Evolução da dívida</span><div className={`text-sm font-bold flex items-center gap-1 ${debtDelta !== null && debtDelta <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{debtDelta === null ? 'Sem comparação' : <>{debtDelta <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}R$ {Math.abs(debtDelta).toLocaleString('pt-BR')}</>}</div></div>
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800"><span className="text-[11px] text-zinc-400">Evolução patrimonial</span><div className={`text-sm font-bold ${netWorthDelta !== null && netWorthDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{netWorthDelta === null ? 'Sem comparação' : `${netWorthDelta >= 0 ? '+' : '-'} R$ ${Math.abs(netWorthDelta).toLocaleString('pt-BR')}`}</div></div>
            </div>
            <article className="p-6 rounded-2xl bg-zinc-950 border border-amber-500/20 whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed">{selected.analysis}</article>
          </> : <div className="p-12 rounded-2xl bg-zinc-950 border border-zinc-800 text-center text-zinc-500 text-xs"><RefreshCw className="w-7 h-7 mx-auto mb-3" />Solicite uma análise para gerar seu diagnóstico financeiro.</div>}
        </section>
      </div>
    </div>
  );
};
