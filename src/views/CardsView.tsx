import React, { useEffect, useRef, useState } from 'react';
import readXlsxFile from 'read-excel-file';
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
  Upload,
  X,
  Save,
  Search,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { parseCSVToCardPurchases, parseRowsToCardPurchases } from '../utils/importExport';
import { addMonthsToCompetence, getCardInvoices, getCurrentInvoiceCompetence, getOpenCardInvoice, getOpenCardInvoices, transactionBelongsToCard } from '../utils/financialCalculations';
import { CurrencyInput } from '../components/CurrencyInput';
import { useCategories } from '../hooks/useCategories';
import type { CreditCard, Transaction } from '../types';

export const InvoiceTotalValue: React.FC<{ amount: number; className?: string }> = ({ amount, className = '' }) => (
  <span className={className}>
    R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </span>
);

const getCardHistoryTransactions = (transactions: Transaction[], cards: CreditCard[], cardId: string) => {
  const groups = new Map<string, Transaction[]>();
  transactions
    .filter((tx) => transactionBelongsToCard(tx, cards, cardId))
    .forEach((tx) => {
      const total = tx.cartaoDetalhes?.parcelasTotal || 1;
      const baseId = total > 1 ? tx.id.replace(/-\d+$/, '') : tx.id;
      groups.set(baseId, [...(groups.get(baseId) || []), tx]);
    });

  return Array.from(groups.values()).map((items) => {
    const first = [...items].sort((a, b) => (a.cartaoDetalhes?.parcelaAtual || 1) - (b.cartaoDetalhes?.parcelaAtual || 1))[0];
    if (first.cartaoDetalhes?.dataCompra) return first;
    const firstInstallment = first.cartaoDetalhes?.parcelaAtual || 1;
    const purchaseDate = new Date(`${first.data}T12:00:00`);
    purchaseDate.setMonth(purchaseDate.getMonth() - (firstInstallment - 1));
    return { ...first, cartaoDetalhes: { ...first.cartaoDetalhes!, dataCompra: purchaseDate.toISOString().slice(0, 10) } };
  });
};

const sumHistoryAmount = (items: Transaction[]) =>
  items.reduce((total, tx) => total + Math.round(tx.valor * 100), 0) / 100;

export const CardsView: React.FC = () => {
  const { cards, transactions, payCardInvoice, openNewTransactionModal, addCard, updateCard, deleteCard, addTransaction, updateTransaction, saveTransactionBatch, deleteTransaction } = useFinancial();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBulkPurchaseOpen, setIsBulkPurchaseOpen] = useState(false);
  const { categories: cardExpenseCategories, addCategory } = useCategories(transactions.map((tx) => tx.categoria));
  const [bulkPurchases, setBulkPurchases] = useState([
    { descricao: '', valorParcela: '', parcelas: 1 },
  ]);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkEditRows, setBulkEditRows] = useState<Array<{ id: string; transactionIds: string[]; parcelasTotal: number; parcelasOriginais: number; possuiPagamento: boolean; recorrente: boolean; descricao: string; valor: string; valorOriginal: number; data: string; categoria: string; observacao: string; originalValues?: { descricao: string; valor: number; data: string; categoria: string; observacao: string; parcelasTotal: number; recorrente: boolean } }>>([]);
  const [bulkEditSearch, setBulkEditSearch] = useState('');
  const [isSavingBulkEdit, setIsSavingBulkEdit] = useState(false);
  const [newCardForm, setNewCardForm] = useState({
    nome: '',
    bandeira: 'VISA' as const,
    finalCartao: '',
    limiteTotal: '15000',
    fechamentoDia: 10,
    vencimentoDia: 20,
    corGradiente: '#78350f',
    categoriaCard: 'AUREUM BLACK',
  });

  useEffect(() => {
    if (!selectedCardId && cards.length > 0) setSelectedCardId(cards[0].id);
    if (selectedCardId && cards.length > 0 && !cards.some((card) => card.id === selectedCardId)) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

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
      corGradiente: '#78350f',
      categoriaCard: 'AUREUM BLACK',
    });
  };

  const handleAddBulkEditRow = () => {
    const newId = `new-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
    setBulkEditRows((rows) => [
      {
        id: newId,
        transactionIds: [],
        parcelasTotal: 1,
        parcelasOriginais: 1,
        possuiPagamento: false,
        recorrente: false,
        descricao: '',
        valor: '0',
        valorOriginal: 0,
        data: new Date().toISOString().slice(0, 10),
        categoria: 'LOC MOTTUS',
        observacao: '',
        originalValues: undefined,
      },
      ...rows,
    ]);
  };

  const handleAddCardExpenseCategory = () => {
    const category = prompt('Nome da nova categoria:')?.trim().toUpperCase();
    if (!category) return;
    if (cardExpenseCategories.some((item) => item.toLocaleUpperCase('pt-BR') === category)) {
      alert('Esta categoria já está cadastrada.');
      return;
    }
    addCategory(category);
  };

  const openBulkEdit = () => {
    if (!selectedCard) return;
    const cardItems = transactions.filter((tx) => transactionBelongsToCard(tx, cards, selectedCard.id));
    const groups = new Map<string, typeof cardItems>();
    cardItems.forEach((tx) => {
      const total = tx.cartaoDetalhes?.parcelasTotal || 1;
      const baseId = tx.cartaoDetalhes?.recorrente && tx.cartaoDetalhes.recorrenciaId
        ? tx.cartaoDetalhes.recorrenciaId
        : total > 1 ? tx.id.replace(/-\d+$/, '') : tx.id;
      groups.set(baseId, [...(groups.get(baseId) || []), tx]);
    });
    const rows = Array.from(groups.entries()).map(([id, items]) => {
      const ordered = [...items].sort((a, b) => (a.cartaoDetalhes?.parcelaAtual || 1) - (b.cartaoDetalhes?.parcelaAtual || 1));
      const isRecurring = items.some((tx) => tx.cartaoDetalhes?.recorrente);
      const first = isRecurring
        ? [...ordered].reverse().find((tx) => tx.status !== 'PAGO' && tx.status !== 'CANCELADO') || ordered[ordered.length - 1]
        : ordered[0];
      const firstInstallment = first.cartaoDetalhes?.parcelaAtual || 1;
      const baseDate = new Date(`${first.data}T12:00:00`);
      baseDate.setMonth(baseDate.getMonth() - (firstInstallment - 1));
      const purchaseDate = first.cartaoDetalhes?.dataCompra || baseDate.toISOString().slice(0, 10);
      const description = first.descricao.replace(/\s*\(\d+\/\d+\)\s*$/, '');
      const observation = first.observacao || '';
      return {
        id, transactionIds: ordered.map((tx) => tx.id), parcelasTotal: first.cartaoDetalhes?.parcelasTotal || 1,
        parcelasOriginais: first.cartaoDetalhes?.parcelasTotal || 1, possuiPagamento: ordered.some((tx) => tx.status === 'PAGO'),
        recorrente: isRecurring,
        descricao: description, valor: String(first.valor), valorOriginal: first.valor,
        data: purchaseDate, categoria: first.categoria, observacao: observation,
        originalValues: { descricao: description, valor: first.valor, data: purchaseDate, categoria: first.categoria, observacao: observation, parcelasTotal: first.cartaoDetalhes?.parcelasTotal || 1, recorrente: isRecurring },
      };
    }).sort((a, b) => b.data.localeCompare(a.data));
    setBulkEditSearch('');
    setBulkEditRows(rows);
    setIsBulkEditOpen(true);
  };

  const saveBulkEdit = async () => {
    const invalid = bulkEditRows.some((row) => !row.descricao.trim() || !row.data || !Number.isFinite(Number(row.valor.replace(',', '.'))) || !Number.isInteger(row.parcelasTotal) || row.parcelasTotal < 1);
    if (invalid) { alert('Revise as descrições, valores e datas antes de salvar.'); return; }
    const upserts: typeof transactions = [];
    const deletedIds: string[] = [];
    const samePersistedData = (left: typeof transactions[number], right: typeof transactions[number]) =>
      JSON.stringify(left) === JSON.stringify(right);

    bulkEditRows.forEach((row) => {
      const isNew = !row.transactionIds || row.transactionIds.length === 0;
      if (isNew) {
        const firstCompetence = getCurrentInvoiceCompetence();
        const baseId = `tx-bulk-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
        const generatedInstallments = row.recorrente ? 1 : row.parcelasTotal;
        const recurrenceId = row.recorrente ? `rec-card-${globalThis.crypto?.randomUUID?.() || Date.now()}` : undefined;
        for (let installment = 1; installment <= generatedInstallments; installment += 1) {
          upserts.push({
            id: row.parcelasTotal > 1 ? `${baseId}-${installment}` : baseId,
            tipo: 'DESPESA',
            descricao: generatedInstallments > 1 ? `${row.descricao.trim()} (${installment}/${generatedInstallments})` : row.descricao.trim(),
            valor: Number(row.valor.replace(',', '.')),
            data: row.data,
            categoria: row.categoria.trim() || 'Outros',
            empresa: 'Pessoal', centroCusto: 'Indefinido', formaPagamento: 'Cartão de Crédito',
            origemFinanceira: 'CARTAO_CREDITO', status: installment === 1 ? 'PENDENTE' : 'AGENDADO',
            observacao: row.observacao.trim(),
            cartaoDetalhes: {
              cartaoId: selectedCard.id, cartaoNome: selectedCard.nome,
              parcelaAtual: installment, parcelasTotal: row.recorrente ? undefined : generatedInstallments,
              melhorDiaCompra: selectedCard.fechamentoDia, diaVencimento: selectedCard.vencimentoDia,
              dataCompra: row.data,
              competenciaFatura: addMonthsToCompetence(firstCompetence, installment - 1),
              competenciaDefinidaEmLote: true,
              recorrente: row.recorrente || undefined,
              recorrenciaId: recurrenceId,
              recorrenciaAtiva: row.recorrente || undefined,
            },
          });
        }
        return;
      }

      const originalValues = row.originalValues;
      const rowWasEdited = !originalValues
        || row.descricao.trim() !== originalValues.descricao
        || Number(row.valor.replace(',', '.')) !== originalValues.valor
        || row.data !== originalValues.data
        || row.categoria.trim() !== originalValues.categoria
        || row.observacao.trim() !== originalValues.observacao
        || row.parcelasTotal !== originalValues.parcelasTotal
        || row.recorrente !== originalValues.recorrente;
      if (!rowWasEdited) return;

      const allExistingInstallments = row.transactionIds
        .map((transactionId) => transactions.find((tx) => tx.id === transactionId))
        .filter((tx): tx is NonNullable<typeof tx> => Boolean(tx))
        .sort((a, b) => (a.cartaoDetalhes?.parcelaAtual || 1) - (b.cartaoDetalhes?.parcelaAtual || 1));
      const wasRecurring = Boolean(row.originalValues?.recorrente);
      const existingInstallments = row.recorrente || wasRecurring
        ? allExistingInstallments.filter((tx) => tx.status !== 'PAGO' && tx.status !== 'CANCELADO')
        : allExistingInstallments;
      const original = existingInstallments[0] || allExistingInstallments[0];
      if (!original) return;
      const firstCompetence = getCurrentInvoiceCompetence();
      const targetInstallments = row.recorrente ? 1 : row.parcelasTotal;
      const recurrenceId = row.recorrente
        ? original.cartaoDetalhes?.recorrenciaId || `rec-card-${globalThis.crypto?.randomUUID?.() || Date.now()}`
        : undefined;
      existingInstallments
        .filter((tx) => (tx.cartaoDetalhes?.parcelaAtual || 1) > targetInstallments && tx.status !== 'PAGO')
        .forEach((tx) => deletedIds.push(tx.id));

      for (let installment = 1; installment <= targetInstallments; installment += 1) {
        const current = existingInstallments.find((tx) => (tx.cartaoDetalhes?.parcelaAtual || 1) === installment);
        const target = {
          ...(current || original),
          id: current?.id || `${row.id}-${installment}`,
          descricao: targetInstallments > 1 ? `${row.descricao.trim()} (${installment}/${targetInstallments})` : row.descricao.trim(),
          valor: Number(row.valor.replace(',', '.')),
          data: row.data,
          categoria: row.categoria.trim() || 'Outros',
          observacao: row.observacao.trim(),
          status: current?.status || 'AGENDADO' as const,
          cartaoDetalhes: {
            ...(current?.cartaoDetalhes || original.cartaoDetalhes),
            cartaoId: selectedCard.id, cartaoNome: selectedCard.nome,
            melhorDiaCompra: selectedCard.fechamentoDia, diaVencimento: selectedCard.vencimentoDia,
            dataCompra: row.data, parcelaAtual: installment, parcelasTotal: row.recorrente ? undefined : targetInstallments,
            competenciaFatura: addMonthsToCompetence(firstCompetence, installment - 1),
            competenciaDefinidaEmLote: true,
            recorrente: row.recorrente || undefined,
            recorrenciaId: recurrenceId,
            recorrenciaAtiva: row.recorrente || undefined,
          },
        };
        if (!current || !samePersistedData(current, target)) upserts.push(target);
      }
    });

    if (!upserts.length && !deletedIds.length) {
      setIsBulkEditOpen(false);
      alert('Nenhuma alteração para salvar.');
      return;
    }
    setIsSavingBulkEdit(true);
    const result = await saveTransactionBatch(upserts, deletedIds);
    setIsSavingBulkEdit(false);
    if (!result.success) {
      console.error('Falha ao salvar lançamentos em lote:', result.error);
      alert(`Não foi possível salvar as alterações no banco. ${String((result.error as any)?.message || result.error || '')}`);
      return;
    }
    setIsBulkEditOpen(false);
    alert(`${upserts.length} lançamento(s) confirmado(s) no banco com sucesso.`);
  };

  const handleDeleteCardTransaction = (transactionId: string) => {
    const transaction = transactions.find((tx) => tx.id === transactionId);
    if (!transaction) return;
    const recurrenceId = transaction.cartaoDetalhes?.recorrenciaId;
    if (transaction.cartaoDetalhes?.recorrente && recurrenceId) {
      if (!confirm(`Excluir a assinatura recorrente "${transaction.descricao}" e todas as cobranças vinculadas?`)) return;
      transactions.filter((tx) => tx.cartaoDetalhes?.recorrenciaId === recurrenceId).forEach((tx) => deleteTransaction(tx.id));
      return;
    }
    if (confirm(`Excluir o lançamento "${transaction.descricao}" da fatura?`)) deleteTransaction(transaction.id);
  };

  const handleEditCard = (cardId: string) => {
    const card = cards.find((item) => item.id === cardId);
    if (!card) return;
    const nome = prompt('Nome do cartão:', card.nome)?.trim();
    if (!nome) return;
    const limite = Number(prompt('Limite total (R$):', String(card.limiteTotal))?.replace(',', '.'));
    if (!Number.isFinite(limite) || limite < 0) return;
    const currentColor = /^#[0-9a-f]{6}$/i.test(card.corGradiente) ? card.corGradiente : '#78350f';
    const color = prompt('Cor do cartão (formato hexadecimal, exemplo #6d28d9):', currentColor)?.trim();
    if (!color || !/^#[0-9a-f]{6}$/i.test(color)) {
      alert('Informe uma cor hexadecimal válida, por exemplo #6d28d9.');
      return;
    }
    updateCard(cardId, { nome, limiteTotal: limite, corGradiente: color });
  };

  const handleSaveBulkPurchases = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCard) {
      alert('Selecione um cartão antes de criar os lançamentos.');
      return;
    }
    const validPurchases = bulkPurchases
      .map((purchase) => ({
        descricao: purchase.descricao.trim(),
        valorParcela: Number(purchase.valorParcela.replace(',', '.')),
        parcelas: Math.max(1, Math.trunc(purchase.parcelas || 1)),
      }))
      .filter((purchase) => purchase.descricao && Number.isFinite(purchase.valorParcela) && purchase.valorParcela !== 0);

    if (!validPurchases.length) {
      alert('Preencha ao menos uma compra com descrição e valor válido.');
      return;
    }

    const firstDue = new Date().toISOString().slice(0, 10);

    let totalGenerated = 0;
    validPurchases.forEach((purchase) => {
      addTransaction({
        tipo: 'DESPESA',
        descricao: purchase.descricao,
        valor: purchase.valorParcela * purchase.parcelas,
        data: firstDue,
        categoria: 'Outros',
        empresa: 'Pessoal',
        centroCusto: 'Indefinido',
        formaPagamento: 'Cartão de Crédito',
        origemFinanceira: 'CARTAO_CREDITO',
        status: 'PENDENTE',
        observacao: `${purchase.parcelas} parcela(s) de R$ ${purchase.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        cartaoDetalhes: {
          cartaoId: selectedCard.id,
          cartaoNome: selectedCard.nome,
          parcelaAtual: 1,
          parcelasTotal: purchase.parcelas,
          melhorDiaCompra: selectedCard.fechamentoDia,
          diaVencimento: selectedCard.vencimentoDia,
        },
      }, purchase.parcelas > 1);
      totalGenerated += purchase.parcelas;
    });

    alert(`${validPurchases.length} compras cadastradas e ${totalGenerated} lançamentos mensais gerados em ${selectedCard.nome}.`);
    setBulkPurchases([{ descricao: '', valorParcela: '', parcelas: 1 }]);
    setIsBulkPurchaseOpen(false);
  };

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  const handleImportCardTransactions = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCard) return;
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const imported = extension === 'xlsx'
        ? parseRowsToCardPurchases(await readXlsxFile(file) as unknown[][])
        : parseCSVToCardPurchases(await file.text());
      if (!imported.length) {
        alert('Nenhuma compra válida encontrada. Use as colunas Descrição, Valor e Data.');
        return;
      }
      let totalLancamentos = 0;
      imported.forEach(({ transaction, parcelasRestantes }) => {
        addTransaction({
          ...transaction,
          valor: transaction.valor * parcelasRestantes,
          tipo: 'DESPESA',
          origemFinanceira: 'CARTAO_CREDITO',
          formaPagamento: 'Cartão de Crédito',
          status: 'PENDENTE',
          observacao: parcelasRestantes > 1
            ? `Importação: ${parcelasRestantes} parcelas restantes de R$ ${transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : transaction.observacao,
          cartaoDetalhes: {
            cartaoId: selectedCard.id,
            cartaoNome: selectedCard.nome,
            parcelaAtual: 1,
            parcelasTotal: parcelasRestantes,
            melhorDiaCompra: selectedCard.fechamentoDia,
            diaVencimento: selectedCard.vencimentoDia,
          },
        }, parcelasRestantes > 1);
        totalLancamentos += parcelasRestantes;
      });
      alert(`${imported.length} compras importadas para ${selectedCard.nome}, gerando ${totalLancamentos} lançamentos de fatura.`);
      setIsImportOpen(false);
    } catch (error) {
      console.error('Erro ao importar compras do cartão:', error);
      alert('Não foi possível ler o arquivo. Use CSV ou XLSX.');
    } finally {
      event.target.value = '';
    }
  };

  const selectedInvoice = selectedCard ? getOpenCardInvoice(transactions, cards, selectedCard.id) : undefined;
  const cardTransactions = (selectedCard ? getCardHistoryTransactions(transactions, cards, selectedCard.id) : []).sort((a, b) => {
    return (b.cartaoDetalhes?.dataCompra || b.data)
      .localeCompare(a.cartaoDetalhes?.dataCompra || a.data);
  });
  const selectedInvoiceMonth = selectedInvoice
    ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(`${selectedInvoice.competence}-01T12:00:00Z`))
    : '';

  const totalFaturaAtual = sumHistoryAmount(cardTransactions);
  const saldoFaturaAtual = selectedInvoice?.outstandingAmount || 0;
  const totalEmAbertoCartao = selectedCard
    ? getOpenCardInvoices(transactions, cards).filter((invoice) => invoice.cardId === selectedCard.id).reduce((sum, invoice) => sum + invoice.amount, 0)
    : 0;
  const limiteDisponivel = (selectedCard?.limiteTotal || 0) - totalEmAbertoCartao;
  const pctLimite = Math.round((totalEmAbertoCartao / (selectedCard?.limiteTotal || 1)) * 100);
  const limiteTotalUnificado = cards.reduce((total, card) => total + card.limiteTotal, 0);
  const creditoUtilizadoUnificado = getOpenCardInvoices(transactions, cards).reduce((total, invoice) => total + invoice.amount, 0);
  const limiteDisponivelUnificado = Math.max(0, limiteTotalUnificado - creditoUtilizadoUnificado);
  const percentualUtilizadoUnificado = Math.round(
    (creditoUtilizadoUnificado / (limiteTotalUnificado || 1)) * 100
  );

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
          <input ref={importInputRef} type="file" accept=".csv,.txt,.xlsx" onChange={handleImportCardTransactions} className="hidden" />
          <button
            onClick={() => selectedCard ? setIsImportOpen(true) : alert('Cadastre um cartão primeiro.')}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-blue-500/30 text-blue-400 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Importar Compras</span>
          </button>
          <button
            onClick={() => selectedCard ? setIsBulkPurchaseOpen(true) : alert('Cadastre e selecione um cartão primeiro.')}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Vários Lançamentos</span>
          </button>
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

      {/* Crédito unificado de todos os cartões */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-lg space-y-2">
          <span className="text-xs font-medium text-zinc-400 block">Limite Total Unificado</span>
          <div className="text-xl font-black font-mono text-zinc-100">
            R$ {limiteTotalUnificado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-500">Soma dos limites de {cards.length} {cards.length === 1 ? 'cartão' : 'cartões'}</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-red-500/20 shadow-lg space-y-2">
          <span className="text-xs font-medium text-zinc-400 block">Crédito Utilizado</span>
          <div className="text-xl font-black font-mono text-red-400">
            R$ {creditoUtilizadoUnificado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-500">{percentualUtilizadoUnificado}% do limite comprometido</span>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-emerald-500/30 shadow-lg space-y-2">
          <span className="text-xs font-medium text-zinc-400 block">Limite Disponível Unificado</span>
          <div className="text-xl font-black font-mono text-emerald-400">
            R$ {limiteDisponivelUnificado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
              style={{ width: `${Math.max(0, 100 - percentualUtilizadoUnificado)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Modal Vários Lançamentos */}
      {isBulkPurchaseOpen && selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-emerald-500/30 p-6 rounded-2xl w-full max-w-3xl space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-base font-bold text-zinc-100">Vários Lançamentos no Cartão</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Cartão selecionado: <span className="text-amber-400 font-bold">{selectedCard.nome} • final {selectedCard.finalCartao}</span>
              </p>
            </div>
            <form onSubmit={handleSaveBulkPurchases} className="space-y-3">
              {bulkPurchases.map((purchase, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_170px_140px_40px] gap-2 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 items-end">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Descrição</label>
                    <input
                      value={purchase.descricao}
                      onChange={(event) => setBulkPurchases((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, descricao: event.target.value } : item))}
                      placeholder="Ex.: Televisor"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Valor da parcela (negativo = estorno)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={purchase.valorParcela}
                      onChange={(event) => setBulkPurchases((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, valorParcela: event.target.value } : item))}
                      placeholder="0,00 ou -50,00"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">Quantidade de parcelas</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={purchase.parcelas}
                      onChange={(event) => setBulkPurchases((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, parcelas: Number(event.target.value) || 1 } : item))}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={bulkPurchases.length === 1}
                    onClick={() => setBulkPurchases((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                    className="p-2 rounded-lg text-zinc-500 hover:text-red-400 disabled:opacity-30"
                    title="Remover linha"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setBulkPurchases((items) => [...items, { descricao: '', valorParcela: '', parcelas: 1 }])}
                className="px-3 py-2 rounded-xl border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Adicionar outra compra
              </button>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsBulkPurchaseOpen(false)} className="px-4 py-2 text-xs text-zinc-400">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl">
                  Criar Todos os Lançamentos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Importar Compras */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-blue-500/30 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" /> Importar Compras do Excel
            </h3>
            <p className="text-xs text-zinc-400">
              Escolha o cartão que receberá todas as compras desta planilha.
            </p>
            <div>
              <label className="text-xs text-zinc-300 font-semibold block mb-1">Cartão de destino *</label>
              <select
                value={selectedCardId}
                onChange={(event) => setSelectedCardId(event.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-900 border border-blue-500/30 rounded-xl text-xs text-zinc-100"
              >
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.nome} • final {card.finalCartao}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-200">
              Informe na planilha o valor de cada parcela e quantas parcelas ainda faltam. O sistema criará uma fatura mensal para cada parcela restante.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                disabled={!selectedCardId}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Escolher Planilha
              </button>
            </div>
          </div>
        </div>
      )}

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
                <label className="text-xs text-zinc-400 block mb-1">Cor do Cartão</label>
                <div className="flex items-center gap-3 p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <input type="color" value={newCardForm.corGradiente} onChange={(e) => setNewCardForm({ ...newCardForm, corGradiente: e.target.value })} className="w-10 h-8 rounded cursor-pointer bg-transparent" />
                  <span className="text-xs font-mono text-zinc-300">{newCardForm.corGradiente}</span>
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

      {isBulkEditOpen && selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-amber-500/30 p-5 rounded-2xl w-full max-w-6xl space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Editar lançamentos em lote — {selectedCard.nome}</h3>
                <p className="text-xs text-zinc-400">Cada compra aparece uma única vez. Alterações em itens parcelados são aplicadas a todas as parcelas.</p>
              </div>
              <button onClick={() => setIsBulkEditOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Pesquisar por descrição ou categoria..."
                  value={bulkEditSearch}
                  onChange={(e) => setBulkEditSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <button type="button" onClick={handleAddCardExpenseCategory} className="px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/20 cursor-pointer">
                <Plus className="w-4 h-4" /> Categoria
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1">
              {bulkEditRows.filter((row) =>
                row.descricao.toLowerCase().includes(bulkEditSearch.toLowerCase()) ||
                row.categoria.toLowerCase().includes(bulkEditSearch.toLowerCase())
              ).map((row, index) => (
                <div key={row.id} className="grid grid-cols-1 md:grid-cols-[auto_2fr_1fr_0.8fr_1.2fr_1.5fr_auto] gap-2 items-center p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-mono w-6">{index + 1}</span>
                  <div className="space-y-1">
                    <input value={row.descricao} onChange={(event) => setBulkEditRows((rows) => rows.map((item) => item.id === row.id ? { ...item, descricao: event.target.value } : item))} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100" />
                    {row.parcelasTotal > 1 && <span className="text-[10px] text-amber-400 font-mono">{row.parcelasTotal} parcelas • exibido uma única vez</span>}
                  </div>
                  <CurrencyInput
                    value={parseFloat(row.valor.replace(',', '.')) || 0}
                    onChange={(numVal) => setBulkEditRows((rows) => rows.map((item) => item.id === row.id ? { ...item, valor: String(numVal) } : item))}
                    allowNegative
                    className={`px-3 py-2 bg-zinc-950 border rounded-lg text-xs font-mono ${Number(row.valor.replace(',', '.')) < 0 ? 'border-emerald-500/40 text-emerald-400' : 'border-zinc-800 text-zinc-100'}`}
                  />
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500">Parcelas<input type="number" min="1" max="240" disabled={row.recorrente} value={row.recorrente ? 1 : row.parcelasTotal} onChange={(event) => setBulkEditRows((rows) => rows.map((item) => item.id === row.id ? { ...item, parcelasTotal: Math.max(1, Math.trunc(Number(event.target.value) || 1)) } : item))} className="mt-1 w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-mono disabled:opacity-50" /></label>
                    <label className="flex items-center gap-1.5 text-[10px] text-amber-300 cursor-pointer">
                      <input type="checkbox" checked={row.recorrente} onChange={(event) => setBulkEditRows((rows) => rows.map((item) => item.id === row.id ? { ...item, recorrente: event.target.checked, parcelasTotal: event.target.checked ? 1 : item.parcelasTotal } : item))} />
                      Recorrente mensal
                    </label>
                  </div>
                  <label className="text-[10px] text-zinc-500">Data da compra<input type="date" value={row.data} onChange={(event) => setBulkEditRows((rows) => rows.map((item) => item.id === row.id ? { ...item, data: event.target.value } : item))} className="mt-1 w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100" /></label>
                  <label className="text-[10px] text-zinc-500">Categoria<select value={row.categoria} onChange={(event) => setBulkEditRows((rows) => rows.map((item) => item.id === row.id ? { ...item, categoria: event.target.value } : item))} className="mt-1 w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 cursor-pointer">
                    {!cardExpenseCategories.includes(row.categoria) && <option value={row.categoria}>{row.categoria || 'Selecione'}</option>}
                    {cardExpenseCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select></label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!row.transactionIds || row.transactionIds.length === 0) {
                        setBulkEditRows((rows) => rows.filter((item) => item.id !== row.id));
                      } else {
                        if (confirm('Deseja excluir este lançamento definitivamente?')) {
                          row.transactionIds.forEach((id) => deleteTransaction(id));
                          setBulkEditRows((rows) => rows.filter((item) => item.id !== row.id));
                        }
                      }
                    }}
                    className="p-2 text-zinc-500 hover:text-red-400 border border-zinc-850 hover:border-red-500/30 rounded-lg transition-colors cursor-pointer"
                    title="Remover lançamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleAddBulkEditRow}
                className="px-4 py-2.5 rounded-xl border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2 hover:bg-amber-500/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Adicionar lançamento
              </button>
              <div className="flex gap-2">
                <button onClick={() => setIsBulkEditOpen(false)} className="px-4 py-2.5 rounded-xl bg-zinc-900 text-zinc-300 text-xs font-bold">Cancelar</button>
                <button disabled={isSavingBulkEdit} onClick={saveBulkEdit} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 text-xs font-extrabold flex items-center gap-2 disabled:opacity-60"><Save className="w-4 h-4" />{isSavingBulkEdit ? 'Salvando no banco...' : 'Salvar todos'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cards Carousel / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const isSelected = card.id === selectedCardId;
          const openInvoice = getOpenCardInvoice(transactions, cards, card.id);
          const latestClosedInvoice = getCardInvoices(transactions, cards)
            .filter((invoice) => invoice.cardId === card.id && invoice.status === 'PAGO')
            .at(-1);
          const cardInvoice = openInvoice || latestClosedInvoice;
          const cardFatura = sumHistoryAmount(getCardHistoryTransactions(transactions, cards, card.id));
          const cardSaldo = cardInvoice?.outstandingAmount || 0;

          return (
            <div
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              style={/^#[0-9a-f]{6}$/i.test(card.corGradiente) ? { background: `linear-gradient(135deg, ${card.corGradiente}, #18181b 68%, #09090b)` } : undefined}
              className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-200 bg-gradient-to-br ${
                /^#[0-9a-f]{6}$/i.test(card.corGradiente) ? '' : card.corGradiente
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
                  {isSelected && (
                    <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 text-[9px] font-black uppercase">
                      Selecionado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={/^#[0-9a-f]{6}$/i.test(card.corGradiente) ? card.corGradiente : '#78350f'}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => updateCard(card.id, { corGradiente: event.target.value })}
                    className="w-6 h-6 rounded bg-transparent cursor-pointer"
                    title="Alterar cor do cartão"
                  />
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
                  <span className="text-[10px] text-zinc-400 block font-sans">
                    {cardInvoice?.status === 'PAGO' ? 'Última Fatura Fechada' : 'Fatura em Aberto'}
                  </span>
                  <InvoiceTotalValue
                    amount={cardFatura}
                    className={`font-bold text-sm ${cardFatura < 0 ? 'text-emerald-400' : 'text-amber-400'}`}
                  />
                  <span className={`mt-0.5 text-[9px] font-sans font-bold block ${cardInvoice?.status === 'PAGO' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {cardInvoice?.status === 'PAGO' ? 'FECHADA' : cardInvoice ? 'EM ABERTO' : 'SEM LANÇAMENTOS'}
                  </span>
                  {cardInvoice?.status === 'PENDENTE' && cardSaldo !== cardFatura && (
                    <span className="mt-0.5 text-[9px] font-sans text-zinc-300 block">
                      Saldo em aberto: R$ {cardSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
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
                disabled={!selectedCard || saldoFaturaAtual <= 0}
                onClick={() => selectedCard && payCardInvoice(selectedCard.id, selectedInvoice?.competence)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  Pagar Fatura{selectedInvoiceMonth ? ` de ${selectedInvoiceMonth}` : ''} com 1-Clique (R$ {saldoFaturaAtual.toLocaleString('pt-BR')})
                </span>
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
                Histórico de Lançamentos ({selectedCard?.nome || 'nenhum cartão'})
              </h3>
              <p className="text-xs text-zinc-400">
                Todas as compras do cartão, exibidas uma única vez pela data da compra
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400">{cardTransactions.length} itens</span>
              <button
                onClick={openBulkEdit}
                disabled={!selectedCard || transactions.every((tx) => !transactionBelongsToCard(tx, cards, selectedCard.id))}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1.5 disabled:opacity-40"
              >
                <Edit2 className="w-3.5 h-3.5" /> Editar em lote
              </button>
            </div>
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
                      Data da compra: {tx.cartaoDetalhes?.dataCompra || tx.data} • {tx.categoria}
                      {tx.cartaoDetalhes?.parcelasTotal && (
                        <span className="text-amber-400 ml-2">
                          ({tx.cartaoDetalhes.parcelasTotal}x)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className={`text-right font-mono font-bold text-sm ${tx.valor < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      R$ {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <button
                      onClick={() => openNewTransactionModal(tx)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 border border-zinc-800 hover:border-amber-500/30 transition-colors cursor-pointer"
                      title="Editar lançamento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCardTransaction(tx.id)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 transition-colors"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cardTransactions.length > 0 && (
            <div className="pt-4 mt-4 border-t border-amber-500/20 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-zinc-200 block">Total informado no histórico</span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {selectedInvoiceMonth ? `Competência: ${selectedInvoiceMonth}` : 'Nenhuma fatura aberta'}
                </span>
              </div>
              <div className={`text-lg font-black font-mono ${totalFaturaAtual >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                R$ {totalFaturaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
