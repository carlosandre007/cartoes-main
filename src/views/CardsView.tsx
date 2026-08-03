import React, { useState } from 'react';
import {
  CreditCard as CreditCardIcon,
  ShieldCheck,
  Lock,
  Plus,
  ArrowDownRight,
  Sparkles,
  CheckCircle,
  Eye,
  AlertCircle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

export const CardsView: React.FC = () => {
  const { cards, transactions, payCardInvoice, openNewTransactionModal, addCard, updateCard, deleteCard } = useFinancial();
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [newCardForm, setNewCardForm] = useState({
    nome: '',
    bandeira: 'VISA' as const,
    finalCartao: '',
    limiteTotal: '15000',
    fechamentoDia: 10,
    vencimentoDia: 20,
    corGradiente: 'from-amber-950 via-zinc-900 to-zinc-950',
    categoriaCard: 'AUREUM BLACK',
  });

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardForm.nome.trim()) {
      alert('Informe o nome do cartão.');
      return;
    }
    const createdId = addCard({
      nome: newCardForm.nome,
      bandeira: newCardForm.bandeira,
      finalCartao: newCardForm.finalCartao || String(Math.floor(1000 + Math.random() * 9000)),
      limiteTotal: parseFloat(newCardForm.limiteTotal) || 10000,
      limiteUtilizado: 0,
      fechamentoDia: newCardForm.fechamentoDia,
      vencimentoDia: newCardForm.vencimentoDia,
      corGradiente: newCardForm.corGradiente,
      categoriaCard: newCardForm.categoriaCard,
    });
    setSelectedCardId(createdId);
    setIsAddCardOpen(false);
    setNewCardForm({
      nome: '',
      bandeira: 'VISA',
      finalCartao: '',
      limiteTotal: '15000',
      fechamentoDia: 10,
      vencimentoDia: 20,
      corGradiente: 'from-amber-950 via-zinc-900 to-zinc-950',
      categoriaCard: 'AUREUM BLACK',
    });
  };

  const handleEditCard = (cardId: string) => {
    const card = cards.find((item) => item.id === cardId);
    if (!card) return;
    const nome = prompt('Nome do cartão:', card.nome)?.trim();
    if (!nome) return;
    const limite = Number(prompt('Limite total (R$):', String(card.limiteTotal))?.replace(',', '.'));
    if (!Number.isFinite(limite) || limite < 0) return;
    updateCard(cardId, { nome, limiteTotal: limite });
  };

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  // Transactions filtered for this selected card
  const cardTransactions = transactions.filter(
    (tx) =>
      tx.origemFinanceira === 'CARTAO_CREDITO' &&
      tx.cartaoDetalhes?.cartaoId === selectedCard?.id
  );

  const totalFaturaAtual = selectedCard?.limiteUtilizado || 0;
  const limiteDisponivel = (selectedCard?.limiteTotal || 0) - totalFaturaAtual;
  const pctLimite = Math.round((totalFaturaAtual / (selectedCard?.limiteTotal || 1)) * 100);

  return (
    <div className="p-6 space-y-6 text-zinc-100 font-sans">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 border border-amber-500/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCardIcon className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              AUREUM PRIVATE CARDS • CONCIERGE & LIMITES
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-zinc-100">Gestão de Cartões de Crédito</h2>
          <p className="text-xs text-zinc-400">
            Acompanhe faturas abertas, limites disponíveis e compras parceladas vinculadas ao fluxo central.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAddCardOpen(true)}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-400 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Cadastrar Cartão</span>
          </button>

          <button
            onClick={() =>
              openNewTransactionModal({
                origemFinanceira: 'CARTAO_CREDITO',
                formaPagamento: 'Cartão de Crédito',
              })
            }
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova Compra no Cartão</span>
          </button>
        </div>
      </div>

      {/* Modal Cadastrar Cartão */}
      {isAddCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-amber-500/30 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <CreditCardIcon className="w-5 h-5 text-amber-400" /> Cadastrar Novo Cartão
            </h3>
            <form onSubmit={handleCreateCard} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nome do Cartão</label>
                <input
                  type="text"
                  placeholder="Ex: Itaú Personnalité Black"
                  value={newCardForm.nome}
                  onChange={(e) => setNewCardForm({ ...newCardForm, nome: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Bandeira</label>
                  <select
                    value={newCardForm.bandeira}
                    onChange={(e) => setNewCardForm({ ...newCardForm, bandeira: e.target.value as any })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100"
                  >
                    <option value="VISA">VISA</option>
                    <option value="MASTERCARD">MASTERCARD</option>
                    <option value="AMEX">AMEX</option>
                    <option value="AUREUM_BLACK">AUREUM BLACK</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Final (4 Dígitos)</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Ex: 8888"
                    value={newCardForm.finalCartao}
                    onChange={(e) => setNewCardForm({ ...newCardForm, finalCartao: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Limite Total (R$)</label>
                <input
                  type="number"
                  placeholder="Ex: 50000"
                  value={newCardForm.limiteTotal}
                  onChange={(e) => setNewCardForm({ ...newCardForm, limiteTotal: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Dia Fechamento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newCardForm.fechamentoDia}
                    onChange={(e) => setNewCardForm({ ...newCardForm, fechamentoDia: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Dia Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newCardForm.vencimentoDia}
                    onChange={(e) => setNewCardForm({ ...newCardForm, vencimentoDia: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCardOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cards Carousel / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const isSelected = card.id === selectedCardId;
          const cardFatura = card.limiteUtilizado;

          return (
            <div
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-200 bg-gradient-to-br ${
                card.corGradiente
              } border ${
                isSelected
                  ? 'border-amber-400 shadow-xl shadow-amber-500/10 scale-[1.02]'
                  : 'border-zinc-800 hover:border-amber-500/40'
              }`}
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400/90 uppercase block">
                    {card.categoriaCard}
                  </span>
                  <div className="text-sm font-bold text-zinc-100 font-sans">{card.nome}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(event) => { event.stopPropagation(); handleEditCard(card.id); }} className="text-zinc-400 hover:text-amber-400" title="Editar cartão"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={(event) => { event.stopPropagation(); if (confirm('Excluir este cartão? Os lançamentos existentes serão preservados.')) { deleteCard(card.id); setSelectedCardId(''); } }} className="text-zinc-400 hover:text-red-400" title="Excluir cartão"><Trash2 className="w-4 h-4" /></button>
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
              </div>

              {/* Card Number */}
              <div className="text-sm font-mono text-zinc-300 tracking-widest mb-6">
                •••• •••• •••• {card.finalCartao}
              </div>

              {/* Fatura & Limite */}
              <div className="flex justify-between items-end border-t border-amber-500/20 pt-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-400 block font-sans">Fatura Atual</span>
                  <span className="font-bold text-amber-400 text-sm">
                    R$ {cardFatura.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block font-sans">Vencimento</span>
                  <span className="text-zinc-200 font-bold">Dia {card.vencimentoDia}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Card Details & Fatura Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Card Metrics & Actions */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center justify-between">
              <span>Resumo do Cartão {selectedCard?.nome || ''}</span>
              <span className="text-[10px] font-mono text-amber-400">FECHAMENTO DIA {selectedCard?.fechamentoDia || '-'}</span>
            </h3>

            {/* Limits Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Limite Utilizado:</span>
                <span className="text-amber-400 font-bold">{pctLimite}%</span>
              </div>
              <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                <div
                  style={{ width: `${pctLimite}%` }}
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                />
              </div>
              <div className="flex justify-between text-xs font-mono pt-1">
                <span className="text-zinc-400">
                  Disponível: R$ {limiteDisponivel.toLocaleString('pt-BR')}
                </span>
                <span className="text-zinc-400">
                  Total: R$ {(selectedCard?.limiteTotal || 0).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Pay Invoice Button */}
            <div className="pt-2 border-t border-zinc-900 space-y-3">
              <button
                disabled={!selectedCard || totalFaturaAtual <= 0}
                onClick={() => selectedCard && payCardInvoice(selectedCard.id)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Pagar Fatura com 1-Clique (R$ {totalFaturaAtual.toLocaleString('pt-BR')})</span>
              </button>
              <p className="text-[11px] text-zinc-500 text-center">
                A liquidação baixa os lançamentos existentes no fluxo central e restaura o limite.
              </p>
            </div>
          </div>

          {/* Security & Settings */}
          <div className="p-6 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Segurança do Cartão
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <span>Cartão Virtual</span>
                <span className="text-zinc-400 font-mono font-semibold">NÃO GERENCIADO</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <span>Compras Online Internacionais</span>
                <span className="text-zinc-400 font-mono font-semibold">NÃO INFORMADO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 columns: Transactions List on this card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Lançamentos na Fatura ({selectedCard?.nome || 'nenhum cartão'})
              </h3>
              <p className="text-xs text-zinc-400">
                Visualização filtrada da tabela central para este cartão
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              {cardTransactions.length} itens
            </span>
          </div>

          <div className="space-y-3">
            {cardTransactions.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                Nenhum lançamento no cartão neste período.
              </div>
            ) : (
              cardTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4 hover:border-amber-500/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-xs text-zinc-200">{tx.descricao}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      Data: {tx.data} • {tx.categoria}
                      {tx.cartaoDetalhes?.parcelasTotal && (
                        <span className="text-amber-400 ml-2">
                          (Parcela {tx.cartaoDetalhes.parcelaAtual}/{tx.cartaoDetalhes.parcelasTotal})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right font-mono font-bold text-amber-400 text-sm">
                    R$ {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
