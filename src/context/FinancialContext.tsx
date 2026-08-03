import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  Transaction,
  CreditCard,
  CreditContract,
  BankAccount,
  FinancialGoal,
  NotificationItem,
  ViewTab,
  TransactionStatus,
  OrigemFinanceira,
} from '../types';
import { isSupabaseConfigured, supabaseApi } from '../lib/supabase';

interface FinancialContextType {
  transactions: Transaction[];
  cards: CreditCard[];
  contracts: CreditContract[];
  bankAccounts: BankAccount[];
  goals: FinancialGoal[];
  notifications: NotificationItem[];
  activeView: ViewTab;
  setActiveView: (view: ViewTab) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Modals & UI States
  isNewTransactionOpen: boolean;
  openNewTransactionModal: (prefill?: Partial<Transaction>) => void;
  closeNewTransactionModal: () => void;
  modalPrefillData: Partial<Transaction> | null;
  
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;

  selectedPayContract: CreditContract | null;
  openPayContractModal: (contract: CreditContract) => void;
  closePayContractModal: () => void;

  // Actions
  addCard: (card: Omit<CreditCard, 'id'>) => string;
  updateCard: (id: string, card: Partial<CreditCard>) => void;
  deleteCard: (id: string) => void;
  addBankAccount: (bank: Omit<BankAccount, 'id'>) => string;
  updateBankAccount: (id: string, bank: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  addContract: (contract: Omit<CreditContract, 'id'>) => string;
  updateContract: (id: string, contract: Partial<CreditContract>) => void;
  deleteContract: (id: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>, generateInstallments?: boolean) => void;
  updateTransaction: (id: string, updated: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  toggleTransactionStatus: (id: string) => void;
  payContractInstallment: (contractId: string, valor: number, metodo: string) => void;
  payCardInvoice: (cardId: string) => void;
  addGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  updateGoal: (id: string, updated: Partial<FinancialGoal>) => void;
  deleteGoal: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  // PWA
  isPwaInstallable: boolean;
  installPwa: () => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

const LOCAL_STORAGE_TX_KEY = 'aureum_transactions_v2';
const LOCAL_STORAGE_CARDS_KEY = 'aureum_cards_v2';
const LOCAL_STORAGE_CONTRACTS_KEY = 'aureum_contracts_v2';
const LOCAL_STORAGE_BANKS_KEY = 'aureum_banks_v2';
const LOCAL_STORAGE_THEME_KEY = 'aureum_theme_dark';
const createId = (prefix: string) => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    return saved !== null ? JSON.parse(saved) : true; // Default dark
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Active View Tab
  const [activeView, setActiveViewRaw] = useState<ViewTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const setActiveView = (view: ViewTab) => {
    setActiveViewRaw(view);
    setIsMobileMenuOpen(false);
  };

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Cards State
  const [cards, setCards] = useState<CreditCard[]>([]);

  // Contracts State
  const [contracts, setContracts] = useState<CreditContract[]>([]);

  // Bank Accounts State
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Goals & Notifications
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const hasLoadedRemoteData = useRef(!isSupabaseConfigured);

  // Supabase Initial Sync
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const loadSupabaseData = async () => {
      try {
        const [dbTxs, dbCards, dbContracts, dbBanks, dbGoals, dbNotifs] = await Promise.all([
          supabaseApi.getTransactions(),
          supabaseApi.getCards(),
          supabaseApi.getContracts(),
          supabaseApi.getBankAccounts(),
          supabaseApi.getGoals(),
          supabaseApi.getNotifications(),
        ]);

        setTransactions(dbTxs);
        setCards(dbCards);
        setContracts(dbContracts);
        setBankAccounts(dbBanks);
        setGoals(dbGoals);
        setNotifications(dbNotifs);
      } catch (err) {
        console.error('Error loading Supabase backend data:', err);
      } finally {
        hasLoadedRemoteData.current = true;
      }
    };

    loadSupabaseData();
  }, []);

  // Sync to local storage & Supabase
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(transactions));
    if (isSupabaseConfigured && hasLoadedRemoteData.current) {
      supabaseApi.upsertTransactions(transactions);
    }
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CARDS_KEY, JSON.stringify(cards));
    if (isSupabaseConfigured && hasLoadedRemoteData.current) {
      supabaseApi.upsertCards(cards);
    }
  }, [cards]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CONTRACTS_KEY, JSON.stringify(contracts));
    if (isSupabaseConfigured && hasLoadedRemoteData.current) {
      supabaseApi.upsertContracts(contracts);
    }
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_BANKS_KEY, JSON.stringify(bankAccounts));
    if (isSupabaseConfigured && hasLoadedRemoteData.current) {
      supabaseApi.upsertBankAccounts(bankAccounts);
    }
  }, [bankAccounts]);

  useEffect(() => {
    if (isSupabaseConfigured && hasLoadedRemoteData.current) {
      supabaseApi.upsertGoals(goals);
    }
  }, [goals]);

  useEffect(() => {
    if (isSupabaseConfigured && hasLoadedRemoteData.current) {
      void (async () => {
        await supabaseApi.deleteAll('notifications');
        await supabaseApi.upsertNotifications(notifications);
      })();
    }
  }, [notifications]);

  // Saldos derivados do fluxo único: cartões e contratos nunca mantêm uma
  // segunda fonte de movimentações.
  useEffect(() => {
    if (!hasLoadedRemoteData.current) return;
    setCards((previous) => {
      let changed = false;
      const next = previous.map((card) => {
        const used = transactions
          .filter(
            (tx) =>
              tx.tipo === 'DESPESA' &&
              tx.origemFinanceira === 'CARTAO_CREDITO' &&
              tx.cartaoDetalhes?.cartaoId === card.id &&
              tx.status !== 'PAGO'
          )
          .reduce((total, tx) => total + tx.valor, 0);
        if (Math.abs(card.limiteUtilizado - used) < 0.005) return card;
        changed = true;
        return { ...card, limiteUtilizado: used };
      });
      return changed ? next : previous;
    });

    setContracts((previous) => {
      let changed = false;
      const next = previous.map((contract) => {
        const payments = transactions.filter(
          (tx) =>
            tx.tipo === 'DESPESA' &&
            tx.status === 'PAGO' &&
            tx.financiamentoDetalhes?.contratoId === contract.id
        );
        const paid = payments.reduce((total, tx) => total + tx.valor, 0);
        const installmentsPaid = Math.min(payments.length, contract.parcelasTotal);
        const remaining = Math.max(0, contract.valorTotal - paid);
        const status: CreditContract['status'] =
          installmentsPaid >= contract.parcelasTotal || remaining <= 0 ? 'LIQUIDADO' : 'EM_DIA';
        if (
          Math.abs(contract.valorPago - paid) < 0.005 &&
          contract.parcelasPagas === installmentsPaid &&
          Math.abs(contract.valorRestante - remaining) < 0.005 &&
          contract.status === status
        ) return contract;
        changed = true;
        return {
          ...contract,
          valorPago: paid,
          valorRestante: remaining,
          parcelasPagas: installmentsPaid,
          status,
        };
      });
      return changed ? next : previous;
    });
  }, [transactions]);

  useEffect(() => {
    if (!hasLoadedRemoteData.current) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 7);
    const dueAlerts: NotificationItem[] = transactions
      .filter((tx) => tx.tipo === 'DESPESA' && tx.status !== 'PAGO')
      .filter((tx) => {
        const due = new Date(`${tx.data}T00:00:00`);
        return !Number.isNaN(due.getTime()) && due <= limit;
      })
      .map((tx) => {
        const overdue = new Date(`${tx.data}T00:00:00`) < today;
        return {
          id: `due-${tx.id}`,
          titulo: overdue ? 'Pagamento vencido' : 'Vencimento próximo',
          mensagem: `${tx.descricao} — R$ ${tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${tx.data}.`,
          data: tx.data,
          lida: false,
          tipo: 'ALERTA',
        };
      });
    setNotifications((previous) => {
      const manual = previous.filter((notification) => !notification.id.startsWith('due-'));
      const readState = new Map(previous.map((notification) => [notification.id, notification.lida]));
      const next = [...dueAlerts.map((alert) => ({ ...alert, lida: readState.get(alert.id) || false })), ...manual];
      const signature = (items: NotificationItem[]) => items.map((item) => `${item.id}:${item.lida}`).join('|');
      return signature(previous) === signature(next) ? previous : next;
    });
  }, [transactions]);

  // Modals UI
  const [isNewTransactionOpen, setIsNewTransactionOpen] = useState(false);
  const [modalPrefillData, setModalPrefillData] = useState<Partial<Transaction> | null>(null);

  const [selectedPayContract, setSelectedPayContract] = useState<CreditContract | null>(null);

  const openNewTransactionModal = (prefill?: Partial<Transaction>) => {
    setModalPrefillData(prefill || null);
    setIsNewTransactionOpen(true);
  };

  const closeNewTransactionModal = () => {
    setIsNewTransactionOpen(false);
    setModalPrefillData(null);
  };

  const openPayContractModal = (contract: CreditContract) => {
    setSelectedPayContract(contract);
  };

  const closePayContractModal = () => {
    setSelectedPayContract(null);
  };

  // Entity Adders
  const addCard = (cardData: Omit<CreditCard, 'id'>): string => {
    const id = createId('card');
    const newCard: CreditCard = { ...cardData, id };
    setCards((prev) => [...prev, newCard]);
    return id;
  };

  const updateCard = (id: string, updated: Partial<CreditCard>) => {
    setCards((prev) => prev.map((card) => card.id === id ? { ...card, ...updated } : card));
  };

  const deleteCard = (id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
    if (isSupabaseConfigured) void supabaseApi.deleteById('credit_cards', id);
  };

  const addBankAccount = (bankData: Omit<BankAccount, 'id'>): string => {
    const id = createId('bank');
    const newBank: BankAccount = { ...bankData, id };
    setBankAccounts((prev) => [...prev, newBank]);
    return id;
  };

  const updateBankAccount = (id: string, updated: Partial<BankAccount>) => {
    setBankAccounts((prev) => prev.map((bank) => bank.id === id ? { ...bank, ...updated } : bank));
  };

  const deleteBankAccount = (id: string) => {
    setBankAccounts((prev) => prev.filter((bank) => bank.id !== id));
    if (isSupabaseConfigured) void supabaseApi.deleteById('bank_accounts', id);
  };

  const addContract = (contractData: Omit<CreditContract, 'id'>): string => {
    const id = createId('contract');
    const newContract: CreditContract = { ...contractData, id };
    setContracts((prev) => [...prev, newContract]);
    return id;
  };

  const updateContract = (id: string, updated: Partial<CreditContract>) => {
    setContracts((prev) => prev.map((contract) => contract.id === id ? { ...contract, ...updated } : contract));
  };

  const deleteContract = (id: string) => {
    setContracts((prev) => prev.filter((contract) => contract.id !== id));
    if (isSupabaseConfigured) void supabaseApi.deleteById('credit_contracts', id);
  };

  // Add Transaction
  const addTransaction = (txData: Omit<Transaction, 'id'>, generateInstallments = false) => {
    const id = createId('tx');
    const newTx: Transaction = { ...txData, id };

    let newTxList: Transaction[] = [newTx];

    // If auto-generating installments for credit card / carnê / financing
    if (
      generateInstallments &&
      newTx.cartaoDetalhes &&
      newTx.cartaoDetalhes.parcelasTotal &&
      newTx.cartaoDetalhes.parcelasTotal > 1
    ) {
      newTxList = [];
      const totalP = newTx.cartaoDetalhes.parcelasTotal;
      const valorParcela = newTx.valor / totalP;
      const baseDate = new Date(newTx.data);

      for (let i = 1; i <= totalP; i++) {
        const nextDate = new Date(baseDate);
        nextDate.setMonth(baseDate.getMonth() + (i - 1));

        const pTx: Transaction = {
          ...newTx,
          id: `${id}-${i}`,
          valor: Number(valorParcela.toFixed(2)),
          data: nextDate.toISOString().split('T')[0],
          descricao: `${newTx.descricao} (${i}/${totalP})`,
          status: i === 1 ? newTx.status : 'AGENDADO',
          cartaoDetalhes: {
            ...newTx.cartaoDetalhes,
            parcelaAtual: i,
            parcelasTotal: totalP,
          },
        };
        newTxList.push(pTx);
      }
    } else if (
      generateInstallments &&
      newTx.financiamentoDetalhes?.parcelasTotal &&
      newTx.financiamentoDetalhes.parcelasTotal > 1
    ) {
      newTxList = [];
      const total = newTx.financiamentoDetalhes.parcelasTotal;
      const baseDate = new Date(`${newTx.data}T12:00:00`);
      for (let i = 1; i <= total; i += 1) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(baseDate.getMonth() + i - 1);
        newTxList.push({
          ...newTx,
          id: `${id}-${i}`,
          data: dueDate.toISOString().slice(0, 10),
          descricao: `${newTx.descricao} (${i}/${total})`,
          status: i === 1 ? newTx.status : 'AGENDADO',
          financiamentoDetalhes: {
            ...newTx.financiamentoDetalhes,
            parcelaAtual: i,
          },
        });
      }
    } else if (newTx.custoFixoDetalhes?.ativo && newTx.custoFixoDetalhes.recorrencia !== 'UNICA') {
      newTxList = [];
      const recurrence = newTx.custoFixoDetalhes.recorrencia;
      const occurrences = recurrence === 'SEMANAL' ? 52 : recurrence === 'MENSAL' ? 12 : recurrence === 'TRIMESTRAL' ? 4 : 3;
      const baseDate = new Date(`${newTx.data}T12:00:00`);
      for (let i = 0; i < occurrences; i += 1) {
        const dueDate = new Date(baseDate);
        if (recurrence === 'SEMANAL') dueDate.setDate(baseDate.getDate() + i * 7);
        if (recurrence === 'MENSAL') dueDate.setMonth(baseDate.getMonth() + i);
        if (recurrence === 'TRIMESTRAL') dueDate.setMonth(baseDate.getMonth() + i * 3);
        if (recurrence === 'ANUAL') dueDate.setFullYear(baseDate.getFullYear() + i);
        const nextDue = new Date(dueDate);
        if (recurrence === 'SEMANAL') nextDue.setDate(dueDate.getDate() + 7);
        if (recurrence === 'MENSAL') nextDue.setMonth(dueDate.getMonth() + 1);
        if (recurrence === 'TRIMESTRAL') nextDue.setMonth(dueDate.getMonth() + 3);
        if (recurrence === 'ANUAL') nextDue.setFullYear(dueDate.getFullYear() + 1);
        newTxList.push({
          ...newTx,
          id: `${id}-${i + 1}`,
          data: dueDate.toISOString().slice(0, 10),
          status: i === 0 ? newTx.status : 'AGENDADO',
          custoFixoDetalhes: {
            ...newTx.custoFixoDetalhes,
            proximoVencimento: nextDue.toISOString().slice(0, 10),
          },
        });
      }
    }

    setTransactions((prev) => [...newTxList, ...prev]);

    // Automatic synchronizations without data duplication
    // 1. Update bank balance if paid
    if (newTx.status === 'PAGO' && newTx.contaBancariaId) {
      setBankAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === newTx.contaBancariaId) {
            const delta = newTx.tipo === 'RECEITA' ? newTx.valor : -newTx.valor;
            return { ...acc, saldo: acc.saldo + delta };
          }
          return acc;
        })
      );
    }

  };

  // Update Transaction
  const updateTransaction = (id: string, updated: Partial<Transaction>) => {
    const current = transactions.find((tx) => tx.id === id);
    if (!current) return;
    const next = { ...current, ...updated };
    const deltaFor = (tx: Transaction) =>
      tx.status === 'PAGO' && tx.contaBancariaId
        ? tx.tipo === 'RECEITA' ? tx.valor : -tx.valor
        : 0;
    setBankAccounts((accounts) =>
      accounts.map((account) => {
        const reversal = current.contaBancariaId === account.id ? -deltaFor(current) : 0;
        const application = next.contaBancariaId === account.id ? deltaFor(next) : 0;
        return reversal || application
          ? { ...account, saldo: account.saldo + reversal + application }
          : account;
      })
    );
    setTransactions((prev) => prev.map((tx) => (tx.id === id ? next : tx)));
  };

  // Delete Transaction
  const deleteTransaction = (id: string) => {
    const current = transactions.find((tx) => tx.id === id);
    if (current?.status === 'PAGO' && current.contaBancariaId) {
      const reversal = current.tipo === 'RECEITA' ? -current.valor : current.valor;
      setBankAccounts((accounts) =>
        accounts.map((account) =>
          account.id === current.contaBancariaId
            ? { ...account, saldo: account.saldo + reversal }
            : account
        )
      );
    }
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    if (isSupabaseConfigured) {
      supabaseApi.deleteTransaction(id);
    }
  };

  // Toggle Status
  const toggleTransactionStatus = (id: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === id) {
          const newStatus: TransactionStatus = tx.status === 'PAGO' ? 'PENDENTE' : 'PAGO';

          // Update bank account if linked
          if (tx.contaBancariaId) {
            const isNowPaid = newStatus === 'PAGO';
            const multiplier = isNowPaid ? 1 : -1;
            const delta = (tx.tipo === 'RECEITA' ? tx.valor : -tx.valor) * multiplier;

            setBankAccounts((accounts) =>
              accounts.map((acc) =>
                acc.id === tx.contaBancariaId ? { ...acc, saldo: acc.saldo + delta } : acc
              )
            );
          }

          return { ...tx, status: newStatus };
        }
        return tx;
      })
    );
  };

  // Pay Contract Installment
  const payContractInstallment = (contractId: string, valor: number, metodo: string) => {
    const contract = contracts.find((c) => c.id === contractId);

    // Add payment transaction to the single central stream!
    if (contract) {
      const today = new Date().toISOString().split('T')[0];
      addTransaction({
        tipo: 'DESPESA',
        descricao: `Pagamento Parcela (${contract.parcelasPagas + 1}/${contract.parcelasTotal}) - ${contract.titulo}`,
        valor: valor,
        data: today,
        categoria: contract.categoria || 'Quitação de Dívida',
        empresa: 'Pessoal',
        centroCusto: 'Diretoria',
        formaPagamento: metodo || 'PIX',
        origemFinanceira: contract.tipo as OrigemFinanceira,
        status: 'PAGO',
        financiamentoDetalhes: {
          instituicao: contract.instituicao,
          valorTotalContrato: contract.valorTotal,
          parcelasTotal: contract.parcelasTotal,
          parcelaAtual: contract.parcelasPagas + 1,
          taxaJurosAnual: contract.taxaJurosAnual,
          contratoId: contract.id,
        },
      });

      // Notification
      const newNotif: NotificationItem = {
        id: createId('notif'),
        titulo: 'Parcela Liquidada com Sucesso',
        mensagem: `A parcela de R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} do contrato "${contract.titulo}" foi paga.`,
        data: new Date().toLocaleString('pt-BR'),
        lida: false,
        tipo: 'SUCESSO',
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  // Pay Card Invoice
  const payCardInvoice = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    const paymentAccount = bankAccounts.find((account) => account.ativa);
    if (!paymentAccount) {
      alert('Cadastre uma conta bancária ativa antes de quitar a fatura.');
      return;
    }

    const valorFatura = card.limiteUtilizado;
    if (valorFatura <= 0) return;

    // Reset card limit used
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, limiteUtilizado: 0 } : c))
    );

    // Os próprios lançamentos do cartão formam o fluxo único. A quitação
    // baixa esses lançamentos na conta, sem criar uma segunda despesa.
    setTransactions((prev) =>
      prev.map((tx) => {
        if (
          tx.origemFinanceira === 'CARTAO_CREDITO' &&
          tx.cartaoDetalhes?.cartaoId === cardId &&
          tx.status !== 'PAGO'
        ) {
          return {
            ...tx,
            status: 'PAGO',
            contaBancariaId: paymentAccount.id,
            contaBancariaNome: paymentAccount.banco,
          };
        }
        return tx;
      })
    );

    setBankAccounts((prev) =>
      prev.map((account) =>
        account.id === paymentAccount.id
          ? { ...account, saldo: account.saldo - valorFatura }
          : account
      )
    );

    // Notification
    const notif: NotificationItem = {
      id: createId('notif'),
      titulo: 'Fatura Quitada',
      mensagem: `A fatura do cartão ${card.nome} no valor de R$ ${valorFatura.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi totalmente quitada.`,
      data: new Date().toLocaleString('pt-BR'),
      lida: false,
      tipo: 'SUCESSO',
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const addGoal = (goalData: Omit<FinancialGoal, 'id'>) => {
    const id = createId('goal');
    setGoals((prev) => [...prev, { ...goalData, id }]);
  };

  const updateGoal = (id: string, updated: Partial<FinancialGoal>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updated } : g)));
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
    if (isSupabaseConfigured) void supabaseApi.deleteById('financial_goals', id);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    if (isSupabaseConfigured) {
      void supabaseApi.deleteAll('notifications');
    }
  };

  // PWA installation trigger
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstallable, setIsPwaInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsPwaInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const installPwa = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          setIsPwaInstallable(false);
        }
        setDeferredPrompt(null);
      });
    } else {
      alert('Para instalar o Aureum App, clique no menu do navegador e selecione "Adicionar à Tela de Início" ou "Instalar Aplicativo".');
    }
  };

  return (
    <FinancialContext.Provider
      value={{
        transactions,
        cards,
        contracts,
        bankAccounts,
        goals,
        notifications,
        activeView,
        setActiveView,
        isDarkMode,
        toggleDarkMode,
        searchQuery,
        setSearchQuery,
        isNewTransactionOpen,
        openNewTransactionModal,
        closeNewTransactionModal,
        modalPrefillData,
        isMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
        selectedPayContract,
        openPayContractModal,
        closePayContractModal,
        addCard,
        updateCard,
        deleteCard,
        addBankAccount,
        updateBankAccount,
        deleteBankAccount,
        addContract,
        updateContract,
        deleteContract,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        toggleTransactionStatus,
        payContractInstallment,
        payCardInvoice,
        addGoal,
        updateGoal,
        deleteGoal,
        markNotificationRead,
        clearAllNotifications,
        isPwaInstallable,
        installPwa,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};
