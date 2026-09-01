import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Calendar, DollarSign, Building, Wallet, CreditCard, Repeat, FileText, CheckCircle2 } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { addMonthsToCompetence, getCurrentInvoiceCompetence } from '../utils/financialCalculations';
import { CurrencyInput } from './CurrencyInput';
import {
  TransactionType,
  TransactionStatus,
  OrigemFinanceira,
  RecorrenciaTipo,
  Transaction,
} from '../types';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({ isOpen, onClose }) => {
  const {
    addTransaction,
    saveTransactionBatch,
    transactions,
    cards,
    bankAccounts,
    contracts,
    modalPrefillData,
    addCard,
    addBankAccount,
    addContract,
    updateContract,
  } = useFinancial();

  // Form Fields
  const [tipo, setTipo] = useState<TransactionType>('DESPESA');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0]);
  const [categoria, setCategoria] = useState('Serviços');
  const [empresa, setEmpresa] = useState('Pessoal');
  const [centroCusto, setCentroCusto] = useState('Diretoria');
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [origemFinanceira, setOrigemFinanceira] = useState<OrigemFinanceira>('CONTA_BANCARIA');
  const [status, setStatus] = useState<TransactionStatus>('PAGO');
  const [contaBancariaId, setContaBancariaId] = useState(bankAccounts[0]?.id || '');
  const [installmentEditOption, setInstallmentEditOption] = useState<'single' | 'future' | 'all'>('single');

  // Conditional Fields: Cartão
  const [cartaoId, setCartaoId] = useState(cards[0]?.id || '');
  const [parcelasTotal, setParcelasTotal] = useState(1);
  const [melhorDiaCompra, setMelhorDiaCompra] = useState(10);
  const [diaVencimento, setDiaVencimento] = useState(20);
  const [gerarParcelasAutomaticas, setGerarParcelasAutomaticas] = useState(true);
  const [cartaoRecorrente, setCartaoRecorrente] = useState(false);
  const [competenciaFatura, setCompetenciaFatura] = useState(() => getCurrentInvoiceCompetence());

  // Conditional Fields: Custo Fixo
  const [recorrencia, setRecorrencia] = useState<RecorrenciaTipo>('MENSAL');
  const [proximoVencimento, setProximoVencimento] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [dataTerminoCustoFixo, setDataTerminoCustoFixo] = useState('');

  // Conditional Fields: Financiamento / Empréstimo / Carnê
  const [instituicao, setInstituicao] = useState('Itaú BBA / Aureum Credit');
  const [valorTotalContrato, setValorTotalContrato] = useState('');
  const [parcelasContrato, setParcelasContrato] = useState(12);
  const [parcelaAtual, setParcelaAtual] = useState(1);
  const [taxaJurosAnual, setTaxaJurosAnual] = useState('9.8');
  const [cetMensal, setCetMensal] = useState('');
  const [cetAnual, setCetAnual] = useState('');
  const [proximoVencimentoFinanciamento, setProximoVencimentoFinanciamento] = useState(() => new Date().toISOString().split('T')[0]);
  const [contratoId, setContratoId] = useState(contracts[0]?.id || '');

  // Inline Modals for Entities Creation
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBank, setNewBank] = useState({
    banco: '',
    agencia: '0001',
    conta: '',
    tipo: 'CORRENTE' as const,
    saldo: '0',
    logoColor: '#fbbf24',
    ativa: true,
  });

  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    nome: '',
    bandeira: 'VISA' as const,
    finalCartao: '',
    limiteTotal: '10000',
    fechamentoDia: 10,
    vencimentoDia: 20,
    corGradiente: '#78350f',
    categoriaCard: 'AUREUM BLACK',
  });

  const [showAddContract, setShowAddContract] = useState(false);
  const [newContract, setNewContract] = useState({
    titulo: '',
    tipo: 'FINANCIAMENTO' as const,
    instituicao: '',
    valorTotal: '100000',
    parcelasTotal: 24,
    valorParcelaMensal: '4500',
    taxaJurosAnual: '9.5',
    cetMensal: '',
    cetAnual: '',
    proximoVencimento: new Date().toISOString().split('T')[0],
    categoria: 'Financiamento Imobiliário',
  });

  // Sync selection when entities list changes
  useEffect(() => {
    if (!contaBancariaId && bankAccounts.length > 0) {
      setContaBancariaId(bankAccounts[0].id);
    }
  }, [bankAccounts, contaBancariaId]);

  useEffect(() => {
    if (!cartaoId && cards.length > 0) {
      setCartaoId(cards[0].id);
    }
  }, [cards, cartaoId]);

  useEffect(() => {
    const selectedCard = cards.find((card) => card.id === cartaoId);
    if (!selectedCard) return;
    setMelhorDiaCompra(selectedCard.fechamentoDia);
    setDiaVencimento(selectedCard.vencimentoDia);
  }, [cards, cartaoId]);

  useEffect(() => {
    if (!contratoId && contracts.length > 0) {
      setContratoId(contracts[0].id);
    }
  }, [contracts, contratoId]);

  useEffect(() => {
    if (
      (origemFinanceira === 'CARTAO_CREDITO' || origemFinanceira === 'CUSTO_FIXO') &&
      !modalPrefillData?.id
    ) {
      setStatus('PENDENTE');
    }
  }, [origemFinanceira, modalPrefillData]);

  // Fill modal with prefill data if present
  useEffect(() => {
    if (!isOpen) return;
    setTipo('DESPESA');
    setDescricao('');
    setValor(0);
    setData(new Date().toISOString().slice(0, 10));
    setCategoria('Serviços');
    setEmpresa('Pessoal');
    setCentroCusto('Diretoria');
    setFormaPagamento('PIX');
    setOrigemFinanceira('CONTA_BANCARIA');
    setStatus('PAGO');
    setContaBancariaId(bankAccounts[0]?.id || '');
    setCartaoId(cards[0]?.id || '');
    setContratoId(contracts[0]?.id || '');
    setParcelasTotal(1);
    setGerarParcelasAutomaticas(true);
    setCartaoRecorrente(false);
    setCompetenciaFatura(getCurrentInvoiceCompetence());
    setDataTerminoCustoFixo('');
    setCetMensal('');
    setCetAnual('');
    setProximoVencimentoFinanciamento(new Date().toISOString().split('T')[0]);
    if (modalPrefillData) {
      if (modalPrefillData.tipo) setTipo(modalPrefillData.tipo);
      if (modalPrefillData.descricao) setDescricao(modalPrefillData.descricao);
      if (modalPrefillData.valor !== undefined) setValor(modalPrefillData.valor);
      if (modalPrefillData.data) setData(modalPrefillData.data);
      if (modalPrefillData.categoria) setCategoria(modalPrefillData.categoria);
      if (modalPrefillData.empresa) setEmpresa(modalPrefillData.empresa);
      if (modalPrefillData.centroCusto) setCentroCusto(modalPrefillData.centroCusto);
      if (modalPrefillData.formaPagamento) setFormaPagamento(modalPrefillData.formaPagamento);
      if (modalPrefillData.origemFinanceira) setOrigemFinanceira(modalPrefillData.origemFinanceira);
      if (modalPrefillData.status) setStatus(modalPrefillData.status);
      if (modalPrefillData.contaBancariaId) setContaBancariaId(modalPrefillData.contaBancariaId);
      if (modalPrefillData.cartaoDetalhes) {
        setCartaoId(modalPrefillData.cartaoDetalhes.cartaoId);
        setParcelasTotal(modalPrefillData.cartaoDetalhes.parcelasTotal || 1);
        setMelhorDiaCompra(modalPrefillData.cartaoDetalhes.melhorDiaCompra || 10);
        setDiaVencimento(modalPrefillData.cartaoDetalhes.diaVencimento || 20);
        setCartaoRecorrente(Boolean(modalPrefillData.cartaoDetalhes.recorrente));
        setCompetenciaFatura(modalPrefillData.cartaoDetalhes.competenciaFatura || getCurrentInvoiceCompetence());
      }
      if (modalPrefillData.custoFixoDetalhes) {
        setRecorrencia(modalPrefillData.custoFixoDetalhes.recorrencia);
        setProximoVencimento(modalPrefillData.custoFixoDetalhes.proximoVencimento);
        setDataTerminoCustoFixo(modalPrefillData.custoFixoDetalhes.dataTermino || '');
      }
      if (modalPrefillData.financiamentoDetalhes) {
        const details = modalPrefillData.financiamentoDetalhes;
        setInstituicao(details.instituicao);
        setValorTotalContrato(String(details.valorTotalContrato));
        setParcelasContrato(details.parcelasTotal);
        setParcelaAtual(details.parcelaAtual);
        setTaxaJurosAnual(String(details.taxaJurosAnual));
        setCetMensal(String(details.cetMensal || ''));
        setCetAnual(String(details.cetAnual || ''));
        setProximoVencimentoFinanciamento(details.proximoVencimento || modalPrefillData.data || new Date().toISOString().split('T')[0]);
        setContratoId(details.contratoId);
      }
    }
    setInstallmentEditOption('single');
  }, [modalPrefillData, isOpen]);

  const relatedInstallments = React.useMemo(() => {
    if (!modalPrefillData?.id || !modalPrefillData.cartaoDetalhes?.parcelasTotal) return [];
    const baseId = modalPrefillData.id.replace(/-\d+$/, '');
    return transactions
      .filter((t) => t.origemFinanceira === 'CARTAO_CREDITO' && (t.id === baseId || t.id.startsWith(`${baseId}-`)))
      .sort((a, b) => (a.cartaoDetalhes?.parcelaAtual || 0) - (b.cartaoDetalhes?.parcelaAtual || 0));
  }, [modalPrefillData, transactions, isOpen]);

  if (!isOpen) return null;

  // Inline Handlers
  const handleCreateBankInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBank.banco.trim()) {
      alert('Informe o nome do banco.');
      return;
    }
    const createdId = addBankAccount({
      banco: newBank.banco,
      agencia: newBank.agencia || '0001',
      conta: newBank.conta || `${Math.floor(10000 + Math.random() * 90000)}-0`,
      tipo: newBank.tipo,
      saldo: parseFloat(newBank.saldo) || 0,
      logoColor: newBank.logoColor,
      ativa: true,
    });
    setContaBancariaId(createdId);
    setShowAddBank(false);
    setNewBank({ banco: '', agencia: '0001', conta: '', tipo: 'CORRENTE', saldo: '0', logoColor: '#fbbf24', ativa: true });
  };

  const handleCreateCardInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCard.nome.trim()) {
      alert('Informe o nome do cartão.');
      return;
    }
    const createdId = addCard({
      nome: newCard.nome,
      bandeira: newCard.bandeira,
      finalCartao: newCard.finalCartao || String(Math.floor(1000 + Math.random() * 9000)),
      limiteTotal: parseFloat(newCard.limiteTotal) || 10000,
      limiteUtilizado: 0,
      fechamentoDia: newCard.fechamentoDia,
      vencimentoDia: newCard.vencimentoDia,
      corGradiente: newCard.corGradiente,
      categoriaCard: newCard.categoriaCard,
    });
    setCartaoId(createdId);
    setMelhorDiaCompra(newCard.fechamentoDia);
    setDiaVencimento(newCard.vencimentoDia);
    setShowAddCard(false);
    setNewCard({
      nome: '',
      bandeira: 'VISA',
      finalCartao: '',
      limiteTotal: '10000',
      fechamentoDia: 10,
      vencimentoDia: 20,
      corGradiente: '#78350f',
      categoriaCard: 'AUREUM BLACK',
    });
  };

  const handleCreateContractInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContract.titulo.trim()) {
      alert('Informe o título do contrato.');
      return;
    }
    const valTotal = parseFloat(newContract.valorTotal) || 0;
    const pTotal = newContract.parcelasTotal || 1;
    const createdId = addContract({
      titulo: newContract.titulo,
      tipo: newContract.tipo,
      instituicao: newContract.instituicao || 'Aureum Credit',
      valorTotal: valTotal,
      valorPago: 0,
      valorRestante: valTotal,
      parcelasTotal: pTotal,
      parcelasPagas: 0,
      valorParcelaMensal: parseFloat(newContract.valorParcelaMensal) || valTotal / pTotal,
      taxaJurosAnual: parseFloat(newContract.taxaJurosAnual) || 0,
      cetMensal: parseFloat(newContract.cetMensal) || 0,
      cetAnual: parseFloat(newContract.cetAnual) || 0,
      proximoVencimento: newContract.proximoVencimento,
      categoria: newContract.categoria,
      status: 'EM_DIA',
    });
    setContratoId(createdId);
    setInstituicao(newContract.instituicao || 'Aureum Credit');
    setValorTotalContrato(newContract.valorTotal);
    setParcelasContrato(pTotal);
    setTaxaJurosAnual(newContract.taxaJurosAnual);
    setCetMensal(newContract.cetMensal);
    setCetAnual(newContract.cetAnual);
    setProximoVencimentoFinanciamento(newContract.proximoVencimento);
    setShowAddContract(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numValor = valor;
    const valorInvalido = origemFinanceira === 'CUSTO_FIXO'
      ? false
      : origemFinanceira === 'CARTAO_CREDITO'
        ? numValor === 0
        : numValor <= 0;
    if (!descricao || valorInvalido) {
      alert(
        origemFinanceira === 'CUSTO_FIXO'
          ? 'Por favor, preencha a descrição do custo fixo.'
          : origemFinanceira === 'CARTAO_CREDITO'
            ? 'Preencha a descrição e informe um valor diferente de zero. Use valor negativo para estorno.'
          : 'Por favor, preencha a descrição e um valor válido.'
      );
      return;
    }
    if (
      origemFinanceira === 'CUSTO_FIXO' &&
      dataTerminoCustoFixo &&
      dataTerminoCustoFixo < data
    ) {
      alert('A data de término do custo fixo não pode ser anterior ao primeiro vencimento.');
      return;
    }

    const selectedBank = bankAccounts.find((b) => b.id === contaBancariaId);
    const selectedCard = cards.find((c) => c.id === cartaoId);

    // Build payload
    const txData: any = {
      tipo,
      descricao,
      valor: numValor,
      data,
      categoria,
      empresa,
      centroCusto,
      formaPagamento,
      origemFinanceira,
      status,
      contaBancariaId: status === 'PAGO' && origemFinanceira !== 'CARTAO_CREDITO' ? contaBancariaId : undefined,
      contaBancariaNome: status === 'PAGO' && origemFinanceira !== 'CARTAO_CREDITO' ? selectedBank?.banco : undefined,
    };

    if (origemFinanceira === 'CARTAO_CREDITO') {
      txData.cartaoDetalhes = {
        cartaoId: cartaoId,
        cartaoNome: selectedCard?.nome || 'Cartão Aureum',
        parcelaAtual: 1,
        parcelasTotal: cartaoRecorrente ? undefined : parcelasTotal,
        melhorDiaCompra: melhorDiaCompra,
        diaVencimento: diaVencimento,
        recorrente: cartaoRecorrente,
        recorrenciaId: cartaoRecorrente
          ? modalPrefillData?.cartaoDetalhes?.recorrenciaId || `rec-card-${globalThis.crypto?.randomUUID?.() || Date.now()}`
          : undefined,
        recorrenciaAtiva: cartaoRecorrente || undefined,
        competenciaFatura,
      };
    } else if (origemFinanceira === 'CUSTO_FIXO') {
      txData.custoFixoDetalhes = {
        recorrencia,
        proximoVencimento,
        dataTermino: dataTerminoCustoFixo || undefined,
        ativo: true,
      };
    } else if (
      origemFinanceira === 'FINANCIAMENTO' ||
      origemFinanceira === 'EMPRESTIMO' ||
      origemFinanceira === 'CARNE' ||
      origemFinanceira === 'CONSORCIO'
    ) {
      txData.financiamentoDetalhes = {
        instituicao,
        valorTotalContrato: parseFloat(valorTotalContrato) || numValor * parcelasContrato,
        parcelasTotal: parcelasContrato,
        parcelaAtual,
        taxaJurosAnual: parseFloat(taxaJurosAnual) || 0,
        cetMensal: parseFloat(cetMensal) || 0,
        cetAnual: parseFloat(cetAnual) || 0,
        proximoVencimento: proximoVencimentoFinanciamento,
        contratoId: contratoId || `contract-${globalThis.crypto?.randomUUID?.() || Date.now()}`,
      };
      if (contratoId && contracts.some((contract) => contract.id === contratoId)) {
        updateContract(contratoId, {
          taxaJurosAnual: parseFloat(taxaJurosAnual) || 0,
          cetMensal: parseFloat(cetMensal) || 0,
          cetAnual: parseFloat(cetAnual) || 0,
          proximoVencimento: proximoVencimentoFinanciamento,
        });
      }
    }

    if (modalPrefillData?.id) {
      const persistedUpdates: Transaction[] = [];
      if (
        origemFinanceira === 'CARTAO_CREDITO' &&
        modalPrefillData.cartaoDetalhes?.parcelasTotal &&
        modalPrefillData.cartaoDetalhes.parcelasTotal > 1
      ) {
        const baseId = modalPrefillData.id.replace(/-\d+$/, '');
        const currentParcel = modalPrefillData.cartaoDetalhes.parcelaAtual || 1;
        const totalParcelas = modalPrefillData.cartaoDetalhes.parcelasTotal || 1;

        if (installmentEditOption === 'single') {
          // Option 1: Only this parcel
          persistedUpdates.push({ ...modalPrefillData, ...txData, id: modalPrefillData.id });
        } else if (installmentEditOption === 'future') {
          // Option 2: This and subsequent parcels
          const linked = transactions.filter((t) => t.origemFinanceira === 'CARTAO_CREDITO' && (t.id === baseId || t.id.startsWith(`${baseId}-`)));
          linked.forEach((t) => {
            const partNum = t.cartaoDetalhes?.parcelaAtual || 1;
            if (partNum >= currentParcel) {
              const monthDiff = partNum - currentParcel;
              const dateShifted = new Date(`${data}T12:00:00`);
              dateShifted.setMonth(dateShifted.getMonth() + monthDiff);

              const updatedData = {
                ...txData,
                descricao: `${descricao} (${partNum}/${totalParcelas})`,
                data: dateShifted.toISOString().slice(0, 10),
                cartaoDetalhes: {
                  ...txData.cartaoDetalhes,
                  parcelaAtual: partNum,
                  parcelasTotal: totalParcelas,
                  competenciaFatura: addMonthsToCompetence(txData.cartaoDetalhes.competenciaFatura, monthDiff),
                }
              };
              persistedUpdates.push({ ...t, ...updatedData, id: t.id });
            }
          });
        } else if (installmentEditOption === 'all') {
          // Option 3: All parcels
          const linked = transactions.filter((t) => t.origemFinanceira === 'CARTAO_CREDITO' && (t.id === baseId || t.id.startsWith(`${baseId}-`)));
          linked.forEach((t) => {
            const partNum = t.cartaoDetalhes?.parcelaAtual || 1;
            const monthDiff = partNum - currentParcel;
            const dateShifted = new Date(`${data}T12:00:00`);
            dateShifted.setMonth(dateShifted.getMonth() + monthDiff);

            const updatedData = {
              ...txData,
              descricao: `${descricao} (${partNum}/${totalParcelas})`,
              data: dateShifted.toISOString().slice(0, 10),
              cartaoDetalhes: {
                ...txData.cartaoDetalhes,
                parcelaAtual: partNum,
                parcelasTotal: totalParcelas,
                competenciaFatura: addMonthsToCompetence(txData.cartaoDetalhes.competenciaFatura, monthDiff),
              }
            };
            persistedUpdates.push({ ...t, ...updatedData, id: t.id });
          });
        }
      } else {
        // Normal update
        persistedUpdates.push({ ...modalPrefillData, ...txData, id: modalPrefillData.id });
      }
      const saveResult = await saveTransactionBatch(persistedUpdates);
      if (!saveResult.success) {
        console.error('Erro ao salvar edição do lançamento:', saveResult.error);
        alert(`Não foi possível salvar a edição no banco. ${String((saveResult.error as any)?.message || saveResult.error || '')}`);
        return;
      }
    } else {
      const shouldGenerateInstallments =
        gerarParcelasAutomaticas &&
        !modalPrefillData?.id &&
        ((origemFinanceira === 'CARTAO_CREDITO' && !cartaoRecorrente && parcelasTotal > 1) ||
          (['FINANCIAMENTO', 'EMPRESTIMO', 'CARNE', 'CONSORCIO'].includes(origemFinanceira) &&
            parcelasContrato > 1 && !modalPrefillData?.financiamentoDetalhes));
      addTransaction(txData, shouldGenerateInstallments);
    }
    onClose();

    // Reset default form state
    setDescricao('');
    setValor(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-amber-500/20 bg-gradient-to-r from-zinc-950 via-amber-950/20 to-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-100 font-sans">
                Novo Lançamento Central
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 font-sans">
                Registro unificado na tabela financeira central de Aureum
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs overflow-y-auto custom-scrollbar flex-1">
          {/* Tipo Switch (Receita x Despesa) */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setTipo('RECEITA')}
              className={`py-2 rounded-lg font-bold transition-all text-xs flex items-center justify-center gap-2 cursor-pointer ${
                tipo === 'RECEITA'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Plus className="w-4 h-4" /> Receita / Entrada
            </button>
            <button
              type="button"
              onClick={() => setTipo('DESPESA')}
              className={`py-2 rounded-lg font-bold transition-all text-xs flex items-center justify-center gap-2 cursor-pointer ${
                tipo === 'DESPESA'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <DollarSign className="w-4 h-4" /> Despesa / Saída
            </button>
          </div>

          {/* Descrição & Valor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-zinc-300 font-semibold block">Descrição *</label>
              <input
                type="text"
                required
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Consultoria, Parcela Financiamento, Fatura Black"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-300 font-semibold block">
                Valor (R$) {origemFinanceira === 'CUSTO_FIXO' ? '(opcional)' : '*'}
              </label>
              <CurrencyInput
                value={valor}
                onChange={setValor}
                allowNegative={origemFinanceira === 'CARTAO_CREDITO'}
                required={origemFinanceira !== 'CUSTO_FIXO'}
                placeholder={origemFinanceira === 'CUSTO_FIXO' ? '0,00' : '0,00'}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-400 font-mono font-bold text-sm focus:outline-none focus:border-amber-500/50"
              />
              {origemFinanceira === 'CUSTO_FIXO' && (
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Para água, energia ou gás, deixe vazio e informe o valor pela edição mensal.
                </span>
              )}
              {origemFinanceira === 'CARTAO_CREDITO' && (
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Para estorno ou crédito na fatura, informe o valor com sinal negativo.
                </span>
              )}
            </div>
          </div>

          {/* Data & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-zinc-300 font-semibold block">Data do Lançamento</label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-300 font-semibold block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50"
              >
                <option value="PAGO">Pago / Liquidado</option>
                <option value="PENDENTE">Pendente</option>
                <option value="AGENDADO">Agendado</option>
                <option value="AGUARDANDO">Aguardando Confirmação</option>
              </select>
            </div>
          </div>

          {/* Categoria, Empresa, Centro de Custo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-zinc-300 font-semibold block">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50"
              >
                <option value="Moradia">Moradia</option>
                <option value="Transporte">Transporte / Veículos</option>
                <option value="Alimentação">Alimentação & Gastronomia</option>
                <option value="Investimentos">Investimentos & Aportes</option>
                <option value="Serviços">Serviços & Contratos</option>
                <option value="Empresarial">Empresarial & Pro labore</option>
                <option value="Tributos">Tributos & Impostos</option>
                <option value="Viagem">Viagens & Lazer</option>
                <option value="Tecnologia">Tecnologia & Servidores</option>
                <option value="Quitação de Dívida">Quitação de Dívida</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-zinc-300 font-semibold block">Empresa / Titular</label>
              <select
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50"
              >
                <option value="Pessoal">Pessoal</option>
                <option value="Aureum Holding">Aureum Holding Capital</option>
                <option value="Aureum Corp">Aureum Corp Solutions</option>
                <option value="Tech Solutions">Tech Solutions Ltda</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-zinc-300 font-semibold block">Centro de Custo</label>
              <select
                value={centroCusto}
                onChange={(e) => setCentroCusto(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50"
              >
                <option value="Diretoria">Diretoria Private</option>
                <option value="Casa">Casa</option>
                <option value="Indefinido">Indefinido</option>
                <option value="Operacional">Operacional</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Patrimonial">Patrimonial & Blindagem</option>
              </select>
            </div>
          </div>

          {/* Forma de Pagamento & Origem Financeira */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-zinc-300 font-semibold block">Forma de Pagamento</label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500/50"
              >
                <option value="PIX">PIX Instatâneo</option>
                <option value="Boleto">Boleto Bancário</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Transferência bancária">Transferência TED/DOC</option>
                <option value="Débito automático">Débito Automático</option>
                <option value="Dinheiro">Espécie / Dinheiro</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-amber-400 font-bold block">Origem Financeira *</label>
              <select
                value={origemFinanceira}
                onChange={(e) => setOrigemFinanceira(e.target.value as OrigemFinanceira)}
                className="w-full px-3.5 py-2 bg-zinc-900 border border-amber-500/40 rounded-xl text-amber-300 font-semibold focus:outline-none focus:border-amber-400"
              >
                <option value="CONTA_BANCARIA">Conta Bancária</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CUSTO_FIXO">Custo Fixo Recorrente</option>
                <option value="FINANCIAMENTO">Financiamento Imobiliário/Auto</option>
                <option value="EMPRESTIMO">Empréstimo Bancário</option>
                <option value="CARNE">Carnê Parcelado</option>
                <option value="CONSORCIO">Consórcio</option>
                <option value="IMPOSTO">Imposto / Tributo</option>
                <option value="INVESTIMENTO">Investimento</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
          </div>

          {/* Conta de liquidação para movimentos já pagos */}
          {status === 'PAGO' && origemFinanceira !== 'CARTAO_CREDITO' && (
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-amber-500/20 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" /> Vincular Conta Bancária
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddBank(!showAddBank)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Nova Conta</span>
                </button>
              </div>

              {showAddBank ? (
                <div className="p-3 bg-zinc-950 rounded-xl border border-amber-500/30 space-y-3">
                  <span className="text-xs font-bold text-zinc-200 block">Nova Conta Bancária</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nome do Banco (ex: BTG Pactual)"
                      value={newBank.banco}
                      onChange={(e) => setNewBank({ ...newBank, banco: e.target.value })}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                    />
                    <input
                      type="text"
                      placeholder="Agência (ex: 0001)"
                      value={newBank.agencia}
                      onChange={(e) => setNewBank({ ...newBank, agencia: e.target.value })}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                    />
                    <input
                      type="text"
                      placeholder="Número da Conta (ex: 12345-6)"
                      value={newBank.conta}
                      onChange={(e) => setNewBank({ ...newBank, conta: e.target.value })}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                    />
                    <input
                      type="number"
                      placeholder="Saldo Inicial (R$)"
                      value={newBank.saldo}
                      onChange={(e) => setNewBank({ ...newBank, saldo: e.target.value })}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddBank(false)}
                      className="px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateBankInline}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Salvar e Selecionar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <select
                    value={contaBancariaId}
                    onChange={(e) => setContaBancariaId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.banco} — Saldo: R$ {b.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* CONDITIONAL SECTION: CARTÃO DE CRÉDITO */}
          {origemFinanceira === 'CARTAO_CREDITO' && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900 to-amber-950/30 border border-amber-500/30 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Detalhes do Cartão de Crédito
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddCard(!showAddCard)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Novo Cartão</span>
                </button>
              </div>

              {showAddCard ? (
                <div className="p-3 bg-zinc-950 rounded-xl border border-amber-500/30 space-y-3">
                  <span className="text-xs font-bold text-zinc-200 block">Novo Cartão de Crédito</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nome do Cartão (ex: Itaú Personalité)"
                      value={newCard.nome}
                      onChange={(e) => setNewCard({ ...newCard, nome: e.target.value })}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                    />
                    <input
                      type="text"
                      placeholder="Últimos 4 Dígitos (ex: 9876)"
                      maxLength={4}
                      value={newCard.finalCartao}
                      onChange={(e) => setNewCard({ ...newCard, finalCartao: e.target.value })}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Limite Total (R$)"
                      value={newCard.limiteTotal}
                      onChange={(e) => setNewCard({ ...newCard, limiteTotal: e.target.value })}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 font-mono"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Fechamento Dia"
                        value={newCard.fechamentoDia}
                        onChange={(e) => setNewCard({ ...newCard, fechamentoDia: parseInt(e.target.value) || 1 })}
                        className="w-1/2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                      />
                      <input
                        type="number"
                        placeholder="Vencimento Dia"
                        value={newCard.vencimentoDia}
                        onChange={(e) => setNewCard({ ...newCard, vencimentoDia: parseInt(e.target.value) || 1 })}
                        className="w-1/2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                      />
                    </div>
                    <label className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400">
                      Cor
                      <input type="color" value={newCard.corGradiente} onChange={(e) => setNewCard({ ...newCard, corGradiente: e.target.value })} className="w-8 h-7 bg-transparent cursor-pointer" />
                      <span className="font-mono">{newCard.corGradiente}</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCard(false)}
                      className="px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCardInline}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Salvar e Selecionar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 block mb-1">Selecione o Cartão</label>
                    <select
                      value={cartaoId}
                      onChange={(e) => {
                        const nextCardId = e.target.value;
                        const nextCard = cards.find((card) => card.id === nextCardId);
                        setCartaoId(nextCardId);
                        if (nextCard) {
                          setMelhorDiaCompra(nextCard.fechamentoDia);
                          setDiaVencimento(nextCard.vencimentoDia);
                        }
                      }}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200"
                    >
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome} (**** {c.finalCartao})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">Número de Parcelas</label>
                    <input
                      type="number"
                      min="1"
                      max="48"
                      value={parcelasTotal}
                      disabled={cartaoRecorrente}
                      onChange={(e) => setParcelasTotal(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 font-mono"
                    />
                    <label className="mt-2 flex items-center gap-2 text-[11px] text-amber-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cartaoRecorrente}
                        onChange={(e) => { setCartaoRecorrente(e.target.checked); if (e.target.checked) setParcelasTotal(1); }}
                        className="rounded border-zinc-700 text-amber-500"
                      />
                      Recorrente mensal (assinatura ou plano)
                    </label>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Competência da Fatura</label>
                  <input
                    type="month"
                    value={competenciaFatura}
                    onChange={(e) => setCompetenciaFatura(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Melhor Dia de Compra</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={melhorDiaCompra}
                    onChange={(e) => setMelhorDiaCompra(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Dia de Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={diaVencimento}
                    onChange={(e) => setDiaVencimento(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200"
                  />
                </div>
              </div>

              {parcelasTotal > 1 && !cartaoRecorrente && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="autoParcelas"
                    checked={gerarParcelasAutomaticas}
                    onChange={(e) => setGerarParcelasAutomaticas(e.target.checked)}
                    className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500/30"
                  />
                  <label htmlFor="autoParcelas" className="text-amber-300 font-medium">
                    Gerar automaticamente {parcelasTotal} lançamentos mensais no fluxo central
                  </label>
                </div>
              )}

              {/* SMART INSTALLMENT EDIT PANEL */}
              {modalPrefillData?.id && modalPrefillData.cartaoDetalhes?.parcelasTotal && modalPrefillData.cartaoDetalhes.parcelasTotal > 1 && (
                <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-3 mt-3">
                  <div className="text-xs font-bold text-zinc-300">
                    Esta compra é parcelada (Parcela {modalPrefillData.cartaoDetalhes.parcelaAtual}/{modalPrefillData.cartaoDetalhes.parcelasTotal})
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="radio"
                        name="installmentEditOption"
                        value="single"
                        checked={installmentEditOption === 'single'}
                        onChange={() => setInstallmentEditOption('single')}
                        className="rounded-full border-zinc-700 text-amber-500 focus:ring-amber-500"
                      />
                      <span>Alterar somente esta parcela</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="radio"
                        name="installmentEditOption"
                        value="future"
                        checked={installmentEditOption === 'future'}
                        onChange={() => setInstallmentEditOption('future')}
                        className="rounded-full border-zinc-700 text-amber-500 focus:ring-amber-500"
                      />
                      <span>Alterar esta e as próximas parcelas</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="radio"
                        name="installmentEditOption"
                        value="all"
                        checked={installmentEditOption === 'all'}
                        onChange={() => setInstallmentEditOption('all')}
                        className="rounded-full border-zinc-700 text-amber-500 focus:ring-amber-500"
                      />
                      <span>Alterar todas as parcelas da compra</span>
                    </label>
                  </div>

                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-[10px] text-zinc-400 text-left">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider font-mono">
                          <th className="pb-1.5 font-semibold">Parcela</th>
                          <th className="pb-1.5 font-semibold">Data</th>
                          <th className="pb-1.5 font-semibold text-right">Valor</th>
                          <th className="pb-1.5 font-semibold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {relatedInstallments.map((item) => {
                          const isCurrent = item.id === modalPrefillData.id;
                          return (
                            <tr key={item.id} className={isCurrent ? "text-amber-400 font-bold bg-amber-500/5" : ""}>
                              <td className="py-1.5">{item.cartaoDetalhes?.parcelaAtual}/{item.cartaoDetalhes?.parcelasTotal}</td>
                              <td className="py-1.5">{item.data}</td>
                              <td className="py-1.5 text-right">R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td className="py-1.5 text-right font-semibold">
                                {item.status === 'PAGO' ? 'Paga' : isCurrent ? 'Atual' : 'Futura'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONDITIONAL SECTION: CUSTO FIXO */}
          {origemFinanceira === 'CUSTO_FIXO' && (
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-amber-500/30 space-y-3">
              <span className="text-amber-400 font-bold text-[11px] block flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5" /> Parâmetros de Recorrência Fixa
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Frequência da Recorrência</label>
                  <select
                    value={recorrencia}
                    onChange={(e) => setRecorrencia(e.target.value as RecorrenciaTipo)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200"
                  >
                    <option value="SEMANAL">Semanal</option>
                    <option value="MENSAL">Mensal</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Próximo Vencimento</label>
                  <input
                    type="date"
                    value={proximoVencimento}
                    onChange={(e) => setProximoVencimento(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Término do Custo (opcional)</label>
                  <input
                    type="date"
                    min={data}
                    value={dataTerminoCustoFixo}
                    onChange={(e) => setDataTerminoCustoFixo(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Ex.: fim do aluguel ou financiamento</span>
                </div>
              </div>
            </div>
          )}

          {/* CONDITIONAL SECTION: FINANCIAMENTO / EMPRÉSTIMO / CARNÊ */}
          {(origemFinanceira === 'FINANCIAMENTO' ||
            origemFinanceira === 'EMPRESTIMO' ||
            origemFinanceira === 'CARNE') && (
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-amber-500/30 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Detalhes do Financiamento / Carnê
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddContract(!showAddContract)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Novo Contrato</span>
                </button>
              </div>

              {showAddContract ? (
                <div className="p-3 bg-zinc-950 rounded-xl border border-amber-500/30 space-y-3">
                  <span className="text-xs font-bold text-zinc-200 block">Novo Contrato de Crédito</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Título do Contrato (ex: Financiamento Imóvel Jardins)"
                      value={newContract.titulo}
                      onChange={(e) => setNewContract({ ...newContract, titulo: e.target.value })}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                    />
                    <input
                      type="text"
                      placeholder="Instituição (ex: Itaú BBA)"
                      value={newContract.instituicao}
                      onChange={(e) => setNewContract({ ...newContract, instituicao: e.target.value })}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                    />
                    <input
                      type="number"
                      placeholder="Valor Total (R$)"
                      value={newContract.valorTotal}
                      onChange={(e) => setNewContract({ ...newContract, valorTotal: e.target.value })}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Total de Parcelas"
                      value={newContract.parcelasTotal}
                      onChange={(e) => setNewContract({ ...newContract, parcelasTotal: parseInt(e.target.value) || 1 })}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 font-mono"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Taxa Juros Anual (%)"
                      value={newContract.taxaJurosAnual}
                      onChange={(e) => setNewContract({ ...newContract, taxaJurosAnual: e.target.value })}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 font-mono"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="CET mensal (%)"
                      value={newContract.cetMensal}
                      onChange={(e) => setNewContract({ ...newContract, cetMensal: e.target.value })}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 font-mono"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="CET anual (%)"
                      value={newContract.cetAnual}
                      onChange={(e) => setNewContract({ ...newContract, cetAnual: e.target.value })}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 font-mono"
                    />
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1">Próximo vencimento</label>
                      <input
                        type="date"
                        required
                        value={newContract.proximoVencimento}
                        onChange={(e) => setNewContract({ ...newContract, proximoVencimento: e.target.value })}
                        className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddContract(false)}
                      className="px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateContractInline}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Salvar e Selecionar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {contracts.length > 0 && (
                    <div className="mb-2">
                      <label className="text-zinc-400 block mb-1">Selecionar Contrato Existente</label>
                      <select
                        value={contratoId}
                        onChange={(e) => {
                          const cId = e.target.value;
                          setContratoId(cId);
                          const selected = contracts.find((c) => c.id === cId);
                          if (selected) {
                            setInstituicao(selected.instituicao);
                            setValorTotalContrato(String(selected.valorTotal));
                            setParcelasContrato(selected.parcelasTotal);
                            setTaxaJurosAnual(String(selected.taxaJurosAnual));
                            setCetMensal(String(selected.cetMensal || ''));
                            setCetAnual(String(selected.cetAnual || ''));
                            setProximoVencimentoFinanciamento(selected.proximoVencimento || new Date().toISOString().split('T')[0]);
                          }
                        }}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 mb-2"
                      >
                        {contracts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.titulo} ({c.instituicao}) — R$ {c.valorTotal.toLocaleString('pt-BR')}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-400 block mb-1">Instituição Concedente</label>
                      <input
                        type="text"
                        value={instituicao}
                        onChange={(e) => setInstituicao(e.target.value)}
                        placeholder="Ex: Itaú BBA, Santander, Dell Financial"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">Valor Total do Contrato (R$)</label>
                      <input
                        type="number"
                        value={valorTotalContrato}
                        onChange={(e) => setValorTotalContrato(e.target.value)}
                        placeholder="Ex: 500000"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-zinc-400 block mb-1">Total Parcelas</label>
                      <input
                        type="number"
                        value={parcelasContrato}
                        onChange={(e) => setParcelasContrato(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">Parcela Atual</label>
                      <input
                        type="number"
                        value={parcelaAtual}
                        onChange={(e) => setParcelaAtual(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">Taxa Juros (% a.a.)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={taxaJurosAnual}
                        onChange={(e) => setTaxaJurosAnual(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-zinc-400 block mb-1">CET Mensal (% a.m.)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={cetMensal}
                        onChange={(e) => setCetMensal(e.target.value)}
                        placeholder="Ex: 1,17"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">CET Anual (% a.a.)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={cetAnual}
                        onChange={(e) => setCetAnual(e.target.value)}
                        placeholder="Ex: 14,98"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">Próximo Vencimento</label>
                      <input
                        type="date"
                        required
                        value={proximoVencimentoFinanciamento}
                        onChange={(e) => setProximoVencimentoFinanciamento(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Submit buttons */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 text-zinc-300 hover:text-zinc-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Salvar no Fluxo Central
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
