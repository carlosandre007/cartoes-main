import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

export const CalendarView: React.FC = () => {
  const { transactions, openNewTransactionModal, toggleTransactionStatus } = useFinancial();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // August 2026
  const [selectedDayStr, setSelectedDayStr] = useState<string>('2026-08-15');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  // First day of month & number of days
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Transactions on selected day
  const dayTransactions = transactions.filter((tx) => tx.data === selectedDayStr);

  return (
    <div className="p-6 space-y-6 text-zinc-100 font-sans">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 border border-amber-500/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              AGENDA FINANCEIRA • VENCIMENTOS & ENTRADAS
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-zinc-100">Calendário Financeiro Unificado</h2>
          <p className="text-xs text-zinc-400">
            Cronograma diário de receitas, despesas, parcelas de cartão e vencimentos de carnês.
          </p>
        </div>

        <button
          onClick={() => openNewTransactionModal()}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Agendar Lançamento</span>
        </button>
      </div>

      {/* Main Calendar Grid & Day Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-4">
          {/* Calendar Month Selector Header */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
            <h3 className="text-base font-bold text-zinc-100 font-sans">
              {monthNames[month]} {year}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:text-amber-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:text-amber-400 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center font-mono text-[11px] font-bold text-zinc-400">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-xs">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 rounded-xl bg-zinc-950/40 opacity-20" />
            ))}

            {/* Month Days */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;

              const dayTxs = transactions.filter((tx) => tx.data === dateStr);
              const hasReceita = dayTxs.some((tx) => tx.tipo === 'RECEITA');
              const hasDespesa = dayTxs.some((tx) => tx.tipo === 'DESPESA');
              const isSelected = selectedDayStr === dateStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDayStr(dateStr)}
                  className={`h-16 p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex justify-between items-center font-mono">
                    <span
                      className={`font-bold ${
                        isSelected ? 'text-amber-400' : 'text-zinc-200'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayTxs.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </div>

                  {/* Indicators */}
                  <div className="flex items-center gap-1 mt-1">
                    {hasReceita && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" title="Receita" />
                    )}
                    {hasDespesa && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" title="Despesa" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda */}
        <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-4">
          <div className="border-b border-zinc-900 pb-3">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block">
              AGENDA DO DIA SELECIONADO
            </span>
            <h3 className="text-base font-bold text-zinc-100 font-mono">{selectedDayStr}</h3>
          </div>

          <div className="space-y-3">
            {dayTransactions.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                Nenhum compromisso agendado para esta data.
              </div>
            ) : (
              dayTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-zinc-200">{tx.descricao}</span>
                    <span
                      className={`font-mono text-xs font-bold ${
                        tx.tipo === 'RECEITA' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {tx.tipo === 'RECEITA' ? '+' : '-'} R$ {tx.valor.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono pt-1">
                    <span>{tx.categoria}</span>
                    <button
                      onClick={() => toggleTransactionStatus(tx.id)}
                      className="text-amber-400 font-bold hover:underline"
                    >
                      {tx.status}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
