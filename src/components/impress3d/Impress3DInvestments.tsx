import React, { useState } from 'react';
import { Plus, Trash2, Edit3, ShieldAlert, Sparkles } from 'lucide-react';
import { Impress3DInvestment } from '../../types/impress3d';
import { InvestmentModal } from './Impress3DModals';

interface Impress3DInvestmentsProps {
  investments: Impress3DInvestment[];
  onAdd: (inv: Omit<Impress3DInvestment, 'id'>) => Promise<void>;
  onEdit: (id: string, inv: Partial<Impress3DInvestment>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const Impress3DInvestments: React.FC<Impress3DInvestmentsProps> = ({
  investments,
  onAdd,
  onEdit,
  onDelete
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInv, setSelectedInv] = useState<Impress3DInvestment | null>(null);

  const totalInvested = investments.reduce((acc, curr) => acc + curr.amount, 0);

  const handleEditClick = (inv: Impress3DInvestment) => {
    setSelectedInv(inv);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedInv(null);
    setIsModalOpen(true);
  };

  const handleSave = async (invFields: any) => {
    if (selectedInv) {
      await onEdit(selectedInv.id, invFields);
    } else {
      await onAdd(invFields);
    }
  };

  const handleDeleteClick = async (id: string, item: string) => {
    const confirm = window.confirm(`Deseja realmente excluir o investimento "${item}"?`);
    if (confirm) {
      await onDelete(id);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Resumo e Ação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900 border border-amber-500/10 p-5 rounded-2xl">
        <div className="space-y-1">
          <div className="text-[10px] sm:text-xs font-semibold text-amber-400/90 uppercase font-mono tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            CONTROLE FINANCEIRO DE ATIVOS
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-zinc-100 font-sans tracking-tight">
            Investimentos Estruturais Realizados
          </h2>
          <p className="text-[10px] sm:text-xs text-zinc-400 max-w-lg leading-relaxed">
            Equipamentos, computadores, filamentos iniciais e estruturas físicas adquiridas para o funcionamento do negócio de impressão 3D.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-zinc-950 px-4 py-3 rounded-xl border border-zinc-850">
          <div className="text-left">
            <span className="text-[9px] text-zinc-500 uppercase font-mono block">Total Investido</span>
            <span className="text-base font-black font-mono text-amber-400">R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <button
            onClick={handleCreateClick}
            className="flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            title="Novo Investimento"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Grid responsiva ou Tabela */}
      <div className="bg-zinc-900 border border-zinc-850 rounded-2xl overflow-hidden">
        {investments.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <ShieldAlert className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400 font-semibold font-mono">Nenhum investimento registrado</p>
            <p className="text-[10px] text-zinc-500 max-w-xs mx-auto">Cadastre sua primeira impressora 3D, ferramentas ou insumos iniciais para começar.</p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-950 text-zinc-400 uppercase font-mono tracking-wider border-b border-zinc-800 text-[10px]">
                    <th className="p-4 font-semibold">Data da compra</th>
                    <th className="p-4 font-semibold">Item / Equipamento</th>
                    <th className="p-4 font-semibold">Categoria</th>
                    <th className="p-4 font-semibold">Fornecedor</th>
                    <th className="p-4 font-semibold">Observações</th>
                    <th className="p-4 font-semibold text-right">Valor</th>
                    <th className="p-4 font-semibold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 text-zinc-300">
                  {investments.map((inv) => (
                    <tr
                      key={inv.id}
                      className={`hover:bg-zinc-950/40 transition-colors ${
                        inv.is_demo ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="p-4 font-mono">
                        {new Date(inv.purchase_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        {inv.is_demo && (
                          <span className="ml-2 px-1.5 py-0.5 text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-semibold uppercase font-mono">Demo</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-zinc-100">{inv.item}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full bg-zinc-950 text-[10px] border border-zinc-800 text-zinc-400">
                          {inv.category}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-zinc-400">{inv.supplier || '—'}</td>
                      <td className="p-4 text-zinc-500 truncate max-w-xs">{inv.notes || '—'}</td>
                      <td className="p-4 font-bold text-right font-mono text-zinc-200">
                        R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(inv)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-950 transition-all active:scale-95"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(inv.id, inv.item)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-950 transition-all active:scale-95"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-zinc-850 p-4 space-y-3">
              {investments.map((inv) => (
                <div
                  key={inv.id}
                  className={`p-3 bg-zinc-950/70 border border-zinc-850/60 rounded-xl space-y-2.5 ${
                    inv.is_demo ? 'border-amber-500/20' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(inv.purchase_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <h4 className="text-xs font-bold text-zinc-200">{inv.item}</h4>
                    </div>
                    <span className="text-xs font-extrabold font-mono text-amber-400">
                      R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">{inv.category}</span>
                    {inv.is_demo && (
                      <span className="px-1.5 py-0.5 text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-semibold uppercase font-mono">Demo</span>
                    )}
                  </div>

                  {inv.notes && <p className="text-[10px] text-zinc-500 italic bg-zinc-950 p-1.5 rounded border border-zinc-900">{inv.notes}</p>}

                  <div className="flex justify-end gap-2 border-t border-zinc-900 pt-2 text-[10px]">
                    <button
                      onClick={() => handleEditClick(inv)}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(inv.id, inv.item)}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-rose-950/30 text-rose-400 rounded-lg flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <InvestmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        investment={selectedInv}
      />
    </div>
  );
};
