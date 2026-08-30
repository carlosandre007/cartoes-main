import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  Impress3DTransaction,
  Impress3DInvestment,
  Impress3DProduct,
  Impress3DSettings
} from '../../types/impress3d';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: any) => Promise<void>;
  transaction?: Impress3DTransaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transaction
}) => {
  const [type, setType] = useState<string>('receita');
  const [date, setDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setDate(transaction.date);
      setDescription(transaction.description);
      setCategory(transaction.category);
      setAmount(transaction.amount.toString());
      setPaymentMethod(transaction.payment_method);
      setNotes(transaction.notes || '');
    } else {
      setType('receita');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setCategory('Venda de produto');
      setAmount('');
      setPaymentMethod('PIX');
      setNotes('');
    }
  }, [transaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date || !category) return;

    setIsSubmitting(true);
    try {
      await onSave({
        type,
        date,
        description,
        category,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        notes,
        is_demo: transaction ? transaction.is_demo : false
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoriesForType = () => {
    if (type === 'receita') return ['Venda de produto', 'Produto personalizado', 'Serviço de impressão', 'Projeto 3D', 'Outros'];
    if (type === 'despesa') return ['Filamento', 'Energia', 'Manutenção', 'Embalagem', 'Marketing', 'Transporte', 'Taxas', 'Marketplace', 'Outros'];
    if (type === 'investimento') return ['Impressora', 'Filamentos', 'Ferramentas', 'Computador', 'Bancada', 'Equipamentos', 'Estrutura', 'Software'];
    return ['Aporte'];
  };

  const categorySuggestions = getCategoriesForType();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-amber-500/20 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-zinc-100 uppercase tracking-wider font-mono">
            {transaction ? 'Editar Movimentação' : 'Nova Movimentação'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-2">Tipo</label>
            <div className="grid grid-cols-4 gap-2">
              {['receita', 'despesa', 'investimento', 'aporte'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    if (t === 'receita') setCategory('Venda de produto');
                    else if (t === 'despesa') setCategory('Filamento');
                    else if (t === 'investimento') setCategory('Impressora');
                    else setCategory('Aporte');
                  }}
                  className={`py-2 px-1 text-[10px] sm:text-xs font-semibold uppercase rounded-xl border transition-all ${
                    type === t
                      ? t === 'receita'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                        : t === 'despesa'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/40'
                        : t === 'investimento'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/40'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/40'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Data */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-1.5">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Valor */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-1.5">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-1.5">Descrição</label>
            <input
              type="text"
              required
              placeholder="Ex: Compra de filamento PLA"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Categoria */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-1.5">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
              >
                {categorySuggestions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Forma de Pagamento */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-1.5">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
              >
                {['PIX', 'Dinheiro', 'Cartão', 'Transferência', 'Outro'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Observação */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-1.5">Observação (Opcional)</label>
            <textarea
              rows={2}
              placeholder="Notas adicionais sobre a transação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (inv: any) => Promise<void>;
  investment?: Impress3DInvestment | null;
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  investment
}) => {
  const [item, setItem] = useState<string>('');
  const [category, setCategory] = useState<string>('Impressora');
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (investment) {
      setItem(investment.item);
      setCategory(investment.category);
      setPurchaseDate(investment.purchase_date);
      setAmount(investment.amount.toString());
      setSupplier(investment.supplier || '');
      setNotes(investment.notes || '');
    } else {
      setItem('');
      setCategory('Impressora');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setSupplier('');
      setNotes('');
    }
  }, [investment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !amount || !purchaseDate || !category) return;

    setIsSubmitting(true);
    try {
      await onSave({
        item,
        category,
        purchase_date: purchaseDate,
        amount: parseFloat(amount),
        supplier,
        notes,
        is_demo: investment ? investment.is_demo : false
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-amber-500/20 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-zinc-100 uppercase tracking-wider font-mono">
            {investment ? 'Editar Investimento Estrutural' : 'Novo Investimento Estrutural'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Item */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-1.5">Equipamento / Estrutura</label>
            <input
              type="text"
              required
              placeholder="Ex: Impressora Ender 3 S1 Pro"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Categoria */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-1.5">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
              >
                {['Impressora', 'Filamentos', 'Ferramentas', 'Computador', 'Bancada', 'Equipamentos', 'Estrutura', 'Software'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Valor */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-1.5">Valor Pago (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Data da Compra */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-1.5">Data da Compra</label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Fornecedor */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-1.5">Fornecedor (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: Creality Store"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Observação */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase font-mono mb-1.5">Observação (Opcional)</label>
            <textarea
              rows={3}
              placeholder="Especificações, garantia ou detalhes adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-[10px] sm:text-xs text-amber-300 rounded-xl leading-relaxed">
            💡 <strong>Nota Operacional:</strong> Salvar um investimento cadastrará automaticamente uma transação do tipo "investimento" no fluxo de caixa geral.
          </div>

          {/* Buttons */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prod: any) => Promise<void>;
  product?: Impress3DProduct | null;
  settings: Impress3DSettings;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  settings
}) => {
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [category, setCategory] = useState<string>('Acessórios');
  const [filamentWeight, setFilamentWeight] = useState<string>('');
  const [printingTime, setPrintingTime] = useState<string>('');
  const [packagingCost, setPackagingCost] = useState<string>('');
  const [otherCost, setOtherCost] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [active, setActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCode(product.code || '');
      setCategory(product.category || 'Acessórios');
      setFilamentWeight(product.filament_weight_g.toString());
      setPrintingTime(product.printing_time_minutes.toString());
      setPackagingCost(product.packaging_cost.toString());
      setOtherCost(product.other_cost.toString());
      setSalePrice(product.sale_price.toString());
      setActive(product.active);
    } else {
      setName('');
      setCode('');
      setCategory('Acessórios');
      setFilamentWeight('');
      setPrintingTime('');
      setPackagingCost('0');
      setOtherCost('0');
      setSalePrice('');
      setActive(true);
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  // Real-time calculations based on inputs
  const rawWeight = parseFloat(filamentWeight) || 0;
  const rawTime = parseFloat(printingTime) || 0;
  const rawPackaging = parseFloat(packagingCost) || 0;
  const rawOther = parseFloat(otherCost) || 0;
  const rawSale = parseFloat(salePrice) || 0;

  const computedFilamentCost = (rawWeight * settings.filament_default_price_kg) / 1000;
  const computedEnergyCost = (rawTime / 60) * (settings.printer_power_w / 1000) * settings.kwh_price;
  const computedTotalCost = computedFilamentCost + computedEnergyCost + rawPackaging + rawOther;
  const computedProfit = rawSale - computedTotalCost;
  const computedMargin = rawSale > 0 ? (computedProfit / rawSale) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !salePrice) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name,
        code,
        category,
        filament_weight_g: rawWeight,
        printing_time_minutes: rawTime,
        filament_cost: computedFilamentCost,
        energy_cost: computedEnergyCost,
        packaging_cost: rawPackaging,
        other_cost: rawOther,
        total_cost: computedTotalCost,
        sale_price: rawSale,
        profit: computedProfit,
        profit_margin: computedMargin,
        active,
        is_demo: product ? product.is_demo : false
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-amber-500/20 rounded-2xl shadow-xl overflow-hidden max-h-[95vh] flex flex-col font-sans">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-zinc-100 uppercase tracking-wider font-mono">
            {product ? 'Editar Produto de Impressão' : 'Novo Produto para Catálogo'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-xs">
          {/* Identificação */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block font-semibold text-zinc-400 uppercase font-mono mb-1">Nome do Produto</label>
              <input
                type="text"
                required
                placeholder="Ex: Suporte de Headset Geek"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-400 uppercase font-mono mb-1">Código / SKU (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: HSET-01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-400 uppercase font-mono mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50"
              >
                {['Acessórios', 'Estátuas & Decoração', 'Utilitários', 'Modelagem Geek', 'Peças Técnicas', 'Outros'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Consumo Técnico */}
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-850 grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-500 uppercase font-mono mb-1">Peso do Filamento (g)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                placeholder="Ex: 85"
                value={filamentWeight}
                onChange={(e) => setFilamentWeight(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-500 uppercase font-mono mb-1">Tempo de Impressão (minutos)</label>
              <input
                type="number"
                min="0"
                required
                placeholder="Ex: 200 (3h20)"
                value={printingTime}
                onChange={(e) => setPrintingTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-amber-500/50 font-mono"
              />
              {rawTime > 0 && (
                <div className="text-[10px] text-zinc-500 mt-1">
                  Formatado: {Math.floor(rawTime / 60)}h{Math.round(rawTime % 60)}min
                </div>
              )}
            </div>
          </div>

          {/* Outros Custos e Preço Final */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-zinc-400 uppercase font-mono mb-1">Embalagem (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={packagingCost}
                onChange={(e) => setPackagingCost(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-400 uppercase font-mono mb-1">Outros Custos (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={otherCost}
                onChange={(e) => setOtherCost(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-amber-400 uppercase font-mono mb-1">Preço de Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0,00"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-amber-500/40 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50 font-mono text-amber-300 font-bold"
              />
            </div>
          </div>

          {/* Cálculo Automático do Custo e Lucro */}
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-850 space-y-2">
            <h4 className="font-bold font-mono text-[10px] text-zinc-400 uppercase tracking-widest border-b border-zinc-850 pb-1">Cálculos Financeiros do Produto</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-500">Custo do filamento ({settings.filament_default_price_kg} R$/kg):</span>
                <span className="font-mono">R$ {computedFilamentCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Custo de energia ({settings.kwh_price.toFixed(2)} kWh):</span>
                <span className="font-mono">R$ {computedEnergyCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-850/50 pt-1 font-bold">
                <span className="text-zinc-400">Custo Total:</span>
                <span className="font-mono text-zinc-200">R$ {computedTotalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-850/50 pt-1 font-bold">
                <span className="text-zinc-400">Lucro Estimado:</span>
                <span className={`font-mono ${computedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  R$ {computedProfit.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between col-span-2 border-t border-zinc-850 pt-1.5 font-extrabold text-amber-400">
                <span>Margem de Lucro:</span>
                <span className="font-mono">{computedMargin.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Ativo e Demo Info */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 accent-amber-500 bg-zinc-950 border-zinc-800 rounded focus:ring-amber-500"
            />
            <label htmlFor="active" className="text-zinc-300 font-semibold cursor-pointer">Produto ativo no catálogo</label>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/10"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
