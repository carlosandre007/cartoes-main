import React, { useState } from 'react';
import { Plus, Trash2, Edit3, ShieldAlert, Sparkles, Printer, DollarSign, Clock } from 'lucide-react';
import { Impress3DProduct, Impress3DSettings } from '../../types/impress3d';
import { ProductModal } from './Impress3DModals';

interface Impress3DProductsProps {
  products: Impress3DProduct[];
  settings: Impress3DSettings;
  onAdd: (prod: Omit<Impress3DProduct, 'id'>) => Promise<void>;
  onEdit: (id: string, prod: Partial<Impress3DProduct>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const Impress3DProducts: React.FC<Impress3DProductsProps> = ({
  products,
  settings,
  onAdd,
  onEdit,
  onDelete
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProd, setSelectedProd] = useState<Impress3DProduct | null>(null);

  const activeProducts = products.filter(p => p.active);
  const avgMargin = activeProducts.length > 0
    ? activeProducts.reduce((acc, curr) => acc + curr.profit_margin, 0) / activeProducts.length
    : 0;

  const handleEditClick = (prod: Impress3DProduct) => {
    setSelectedProd(prod);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedProd(null);
    setIsModalOpen(true);
  };

  const handleSave = async (prodFields: any) => {
    if (selectedProd) {
      await onEdit(selectedProd.id, prodFields);
    } else {
      await onAdd(prodFields);
    }
  };

  const handleDeleteClick = async (id: string, name: string) => {
    const confirm = window.confirm(`Deseja realmente excluir o produto "${name}"?`);
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
            CATÁLOGO E PRECIFICAÇÃO DE IMPRESSÕES
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-zinc-100 font-sans tracking-tight">
            Gestão de Produtos e Margem de Lucro
          </h2>
          <p className="text-[10px] sm:text-xs text-zinc-400 max-w-lg leading-relaxed">
            Consulte os custos estimados de energia, filamento e embalagem de suas peças cadastradas e defina preços de venda que trazem maior margem de retorno.
          </p>
        </div>

        <div className="flex gap-4 items-center bg-zinc-950 px-4 py-3 rounded-xl border border-zinc-850">
          <div className="text-left">
            <span className="text-[9px] text-zinc-500 uppercase font-mono block">Margem Média</span>
            <span className="text-base font-black font-mono text-amber-400">{avgMargin.toFixed(2)}%</span>
          </div>
          <button
            onClick={handleCreateClick}
            className="flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            title="Novo Produto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Grid de Cards de Produtos */}
      {products.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-850 p-8 text-center rounded-2xl space-y-2">
          <ShieldAlert className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-xs text-zinc-400 font-semibold font-mono">Nenhum produto cadastrado</p>
          <p className="text-[10px] text-zinc-500 max-w-xs mx-auto">Cadastre seus modelos 3D mais comuns para ter as estimativas prontas ao vender.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((prod) => (
            <div
              key={prod.id}
              className={`bg-zinc-900 border rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-amber-500/20 transition-all ${
                prod.active ? 'border-zinc-850' : 'border-zinc-850 opacity-60'
              } ${prod.is_demo ? 'bg-amber-500/[0.02]' : ''}`}
            >
              {/* Header do Card */}
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] uppercase font-mono font-semibold bg-zinc-950 text-zinc-400 border border-zinc-800">
                    {prod.category || 'Peças'}
                  </span>
                  <div className="flex items-center gap-1">
                    {prod.is_demo && (
                      <span className="px-1 py-0.5 text-[7px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-semibold uppercase font-mono">Demo</span>
                    )}
                    <span className={`w-2 h-2 rounded-full ${prod.active ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-zinc-100 truncate">{prod.name}</h3>
                {prod.code && <span className="text-[9px] text-zinc-500 font-mono block">SKU: {prod.code}</span>}
              </div>

              {/* Informações Técnicas */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-850/60 text-[10px]">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Printer className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>{prod.filament_weight_g} g</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>{Math.floor(prod.printing_time_minutes / 60)}h{Math.round(prod.printing_time_minutes % 60)}m</span>
                </div>
              </div>

              {/* Tabela de Custos Básicos */}
              <div className="space-y-1.5 text-[10px] border-t border-zinc-850 pt-2 text-zinc-400">
                <div className="flex justify-between">
                  <span>Insumo filamento:</span>
                  <span className="font-mono text-zinc-200">R$ {prod.filament_cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Proporcional de energia:</span>
                  <span className="font-mono text-zinc-200">R$ {prod.energy_cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-850/50 pt-1 text-xs font-bold">
                  <span>Custo total de fabricação:</span>
                  <span className="font-mono text-zinc-200">R$ {prod.total_cost.toFixed(2)}</span>
                </div>
              </div>

              {/* Precificação do Produto */}
              <div className="bg-gradient-to-br from-zinc-950 to-amber-950/10 p-3 rounded-xl border border-amber-500/10 flex items-center justify-between text-xs">
                <div className="text-left">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono block">Preço de Venda</span>
                  <span className="font-black font-mono text-amber-400">R$ {prod.sale_price.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono block">Lucro / Margem</span>
                  <span className="font-extrabold font-mono text-emerald-400">
                    R$ {prod.profit.toFixed(2)} ({prod.profit_margin.toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex justify-end gap-2 border-t border-zinc-850 pt-2 text-[10px]">
                <button
                  onClick={() => handleEditClick(prod)}
                  className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-850 text-zinc-300 rounded-lg flex items-center gap-1 border border-zinc-800"
                >
                  <Edit3 className="w-3 h-3" /> Editar
                </button>
                <button
                  onClick={() => handleDeleteClick(prod.id, prod.name)}
                  className="px-2.5 py-1 bg-zinc-950 hover:bg-rose-950/20 text-rose-400 rounded-lg flex items-center gap-1 border border-zinc-800"
                >
                  <Trash2 className="w-3 h-3" /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        product={selectedProd}
        settings={settings}
      />
    </div>
  );
};
