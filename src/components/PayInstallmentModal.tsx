import React, { useState } from 'react';
import { X, QrCode, Copy, Check, ShieldCheck, ArrowRight } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

export const PayInstallmentModal: React.FC = () => {
  const { selectedPayContract, closePayContractModal, openNewTransactionModal } = useFinancial();
  const [copied, setCopied] = useState(false);
  const [method, setMethod] = useState<'PIX' | 'BOLETO' | 'CONTA'>('PIX');

  if (!selectedPayContract) return null;

  const paymentReference = selectedPayContract.id;

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayment = () => {
    closePayContractModal();
    openNewTransactionModal({
      tipo: 'DESPESA',
      descricao: `Parcela ${selectedPayContract.parcelasPagas + 1}/${selectedPayContract.parcelasTotal} - ${selectedPayContract.titulo}`,
      valor: selectedPayContract.valorParcelaMensal,
      data: new Date().toISOString().slice(0, 10),
      categoria: selectedPayContract.categoria || 'Quitação de dívida',
      empresa: selectedPayContract.instituicao,
      centroCusto: 'Diretoria',
      formaPagamento: method,
      origemFinanceira: selectedPayContract.tipo,
      status: 'PAGO',
      financiamentoDetalhes: {
        instituicao: selectedPayContract.instituicao,
        valorTotalContrato: selectedPayContract.valorTotal,
        parcelasTotal: selectedPayContract.parcelasTotal,
        parcelaAtual: selectedPayContract.parcelasPagas + 1,
        taxaJurosAnual: selectedPayContract.taxaJurosAnual,
        contratoId: selectedPayContract.id,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-zinc-950 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-amber-500/20 bg-gradient-to-r from-zinc-950 via-amber-950/30 to-zinc-950 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
              LIQUIDAÇÃO DE PARCELA
            </div>
            <h3 className="text-sm font-bold text-zinc-100 font-sans">
              {selectedPayContract.titulo}
            </h3>
          </div>
          <button
            onClick={closePayContractModal}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Card Summary */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-amber-500/20 space-y-2">
            <div className="flex justify-between items-center text-zinc-400">
              <span>Parcela Atual:</span>
              <span className="font-mono text-zinc-200 font-bold">
                {selectedPayContract.parcelasPagas + 1} de {selectedPayContract.parcelasTotal}
              </span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Instituição:</span>
              <span className="text-zinc-200 font-medium">{selectedPayContract.instituicao}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Vencimento:</span>
              <span className="text-amber-400 font-mono font-semibold">
                {selectedPayContract.proximoVencimento}
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
              <span className="font-bold text-zinc-300">Valor da Parcela:</span>
              <span className="text-lg font-black font-mono text-amber-400">
                R$ {selectedPayContract.valorParcelaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-semibold block">Forma de Liquidação</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('PIX')}
                className={`py-2 px-3 rounded-xl border font-bold transition-all ${
                  method === 'PIX'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                PIX
              </button>
              <button
                type="button"
                onClick={() => setMethod('CONTA')}
                className={`py-2 px-3 rounded-xl border font-bold transition-all ${
                  method === 'CONTA'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                Débito Aureum
              </button>
              <button
                type="button"
                onClick={() => setMethod('BOLETO')}
                className={`py-2 px-3 rounded-xl border font-bold transition-all ${
                  method === 'BOLETO'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                Boleto
              </button>
            </div>
          </div>

          {/* Referência para conferência */}
          {method === 'PIX' && (
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center gap-3 text-center">
              <div className="p-3 bg-white rounded-xl shadow-lg">
                <QrCode className="w-24 h-24 text-zinc-950" />
              </div>
              <p className="text-[11px] text-zinc-400">
                Confira o pagamento no seu banco e use esta referência no lançamento:
              </p>
              <div className="w-full flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={paymentReference}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-400 truncate"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg hover:bg-amber-500/30 flex items-center gap-1 shrink-0 font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Guarantee info */}
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              A confirmação abrirá o cadastro oficial no Fluxo de Caixa. Nenhum pagamento bancário é executado pelo sistema.
            </span>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirmPayment}
            className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer font-sans"
          >
            <span>Continuar no Fluxo de Caixa</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
