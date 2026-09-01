import React from 'react';
import { ChevronDown, ExternalLink, X } from 'lucide-react';
import { UnifiedDebtCalculation, UnifiedDebtItem, UnifiedDebtOrigin } from '../utils/financialCalculations';

const formatBRL = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const labels: Record<UnifiedDebtOrigin, string> = { CARTAO: 'Cartões', FINANCIAMENTO: 'Financiamentos', CUSTO_FIXO: 'Custos fixos' };

const DebtRow: React.FC<{ item: UnifiedDebtItem; onNavigate: (target: UnifiedDebtItem['targetView']) => void }> = ({ item, onNavigate }) => (
  <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2 text-xs">
    <div className="flex justify-between gap-3"><div className="min-w-0"><strong className="text-zinc-100 block truncate">{item.description}</strong><span className="text-[10px] text-zinc-500 font-mono break-all">{item.reference}</span></div><strong className="text-amber-300 font-mono shrink-0">{formatBRL(item.contribution)}</strong></div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-zinc-400">
      <span>Competência<br /><b className="text-zinc-200">{item.competence || '—'}</b></span><span>Vencimento<br /><b className="text-zinc-200">{item.dueDate || '—'}</b></span><span>Situação<br /><b className="text-zinc-200">{item.status}</b></span><span>Origem<br /><b className="text-zinc-200">{labels[item.origin]}</b></span>
    </div>
    <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 pt-2 font-mono text-[10px]"><span className="text-zinc-500">Antes<br /><b className="text-zinc-200">{formatBRL(item.grossAmount)}</b></span><span className="text-zinc-500">Pagamentos/abatimentos<br /><b className="text-emerald-400">{formatBRL(item.paidAmount)}</b></span><span className="text-zinc-500">Contribuição<br /><b className="text-amber-300">{formatBRL(item.contribution)}</b></span></div>
    {item.exclusionReason && <p className="text-[10px] text-zinc-400">Motivo: <b className="text-orange-300">{item.exclusionReason}</b></p>}
    <button type="button" onClick={() => onNavigate(item.targetView)} className="text-[10px] text-amber-400 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Abrir cadastro de origem</button>
  </div>
);

export const UnifiedDebtMemoryModal: React.FC<{ calculation: UnifiedDebtCalculation; updatedAt: Date; onClose: () => void; onNavigate: (target: UnifiedDebtItem['targetView']) => void }> = ({ calculation, updatedAt, onClose, onNavigate }) => (
  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
    <div role="dialog" aria-modal="true" aria-label="Memória de cálculo do total unificado" className="w-full max-w-6xl max-h-[94vh] overflow-y-auto rounded-2xl bg-zinc-950 border border-amber-500/30 shadow-2xl p-4 sm:p-6 space-y-5">
      <div className="flex justify-between gap-4"><div><h2 className="text-lg font-black text-zinc-100">Memória de cálculo — Total unificado de débitos</h2><p className="text-xs text-zinc-400 mt-1">{calculation.meaning}</p></div><button type="button" onClick={onClose} aria-label="Fechar" className="p-2 text-zinc-400"><X className="w-5 h-5" /></button></div>
      <div className="grid sm:grid-cols-4 gap-2">{(Object.entries(calculation.subtotals) as [UnifiedDebtOrigin, number][]).map(([origin, value]) => <div key={origin} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800"><span className="text-[10px] text-zinc-500">{labels[origin]}</span><strong className="block font-mono text-amber-300">{formatBRL(value)}</strong></div>)}<div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30"><span className="text-[10px] text-red-300">Total exibido</span><strong className="block font-mono text-red-200">{formatBRL(calculation.total)}</strong></div></div>
      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1"><p><b className="text-zinc-200">Fórmula:</b> {formatBRL(calculation.subtotals.CARTAO)} + {formatBRL(calculation.subtotals.FINANCIAMENTO)} + {formatBRL(calculation.subtotals.CUSTO_FIXO)} = <b className="text-amber-300">{formatBRL(calculation.total)}</b></p><p><b className="text-zinc-200">Competência de referência:</b> {calculation.referenceCompetence}</p><p><b className="text-zinc-200">Última atualização dos dados:</b> {updatedAt.toLocaleString('pt-BR')}</p>{calculation.filters.map((filter) => <p key={filter}>• {filter}</p>)}</div>
      {calculation.inconsistencies.length > 0 && <div className="p-3 rounded-xl border border-red-500/30 bg-red-950/20"><strong className="text-xs text-red-300">Possíveis inconsistências</strong>{calculation.inconsistencies.map((message) => <p key={message} className="text-[11px] text-zinc-300 mt-1">• {message}</p>)}</div>}
      {(['CARTAO', 'FINANCIAMENTO', 'CUSTO_FIXO'] as UnifiedDebtOrigin[]).map((origin) => { const items = calculation.included.filter((item) => item.origin === origin); return <section key={origin} className="space-y-2"><div className="flex justify-between"><h3 className="text-sm font-bold text-zinc-100">{labels[origin]}</h3><span className="text-xs font-mono text-amber-300">{formatBRL(calculation.subtotals[origin])}</span></div>{items.length ? items.map((item) => <DebtRow key={item.id} item={item} onNavigate={onNavigate} />) : <p className="text-xs text-zinc-500">Nenhum débito desta origem.</p>}</section>; })}
      <details className="rounded-xl border border-zinc-800 bg-zinc-900/40"><summary className="p-3 cursor-pointer text-xs font-bold text-zinc-300 flex items-center gap-2"><ChevronDown className="w-4 h-4" /> Itens não considerados ({calculation.excluded.length})</summary><div className="p-3 pt-0 space-y-2">{calculation.excluded.length ? calculation.excluded.map((item, index) => <DebtRow key={`${item.id}-${index}`} item={item} onNavigate={onNavigate} />) : <p className="text-xs text-zinc-500">Nenhum item excluído no escopo carregado.</p>}</div></details>
    </div>
  </div>
);
