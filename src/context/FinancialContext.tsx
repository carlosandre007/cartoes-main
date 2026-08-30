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
  RecorrenciaTipo,
} from '../types';
import { isSupabaseConfigured, supabaseApi } from '../lib/supabase';
import { addMonthsToCompetence, calculateInvoiceCompetence, getConsolidatedFlowItems, getInvoiceDueDate, getOpenCardInvoice, getOpenCardInvoices, getTransactionInvoiceCompetence, resolveTransactionCard } from '../utils/financialCalculations';

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
  deleteContractWithTransactions: (id: string) => Promise<boolean>;
  addTransaction: (tx: Omit<Transaction, 'id'>, generateInstallments?: boolean) => void;
  updateTransaction: (id: string, updated: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  deleteTransactions: (ids: string[]) => Promise<boolean>;
  toggleTransactionStatus: (id: string) => void;
  payContractInstallment: (contractId: string, valor: number, metodo: string) => void;
  payCardInvoice: (cardId: string, billingMonth?: string) => void;
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
      const invoices = getOpenCardInvoices(transactions, previous);
      const next = previous.map((card) => {
        const used = invoices.filter((invoice) => invoice.cardId === card.id).reduce((sum, invoice) => sum + invoice.amount, 0);
        if (Math.abs(card.limiteUtilizado - used) < 0.005) return card;
        changed = true;
        return { ...card, limiteUtilizado: used };
      });
      return changed ? next : previous;
    });

    setContracts((previous) => {
      let changed = false;
      const next = previous.map((contract) => {
        const contractTransactions = transactions.filter(
          (tx) =>
            tx.tipo === 'DESPESA' &&
            tx.financiamentoDetalhes?.contratoId === contract.id
        );
        const payments = contractTransactions.filter((tx) => tx.status === 'PAGO');
        const firstRegisteredInstallment = contractTransactions.length
          ? Math.min(...contractTransactions.map((tx) => tx.financiamentoDetalhes?.parcelaAtual || 1))
          : 1;
        const implicitPaidCount = Math.max(0, firstRegisteredInstallment - 1);
        const implicitPaidValue = implicitPaidCount * contract.valorParcelaMensal;
        const paid = implicitPaidValue + payments.reduce((total, tx) => total + tx.valor, 0);
        const installmentsPaid = Math.min(implicitPaidCount + payments.length, contract.parcelasTotal);
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

  // Recupera contratos que ficaram sem registro principal em versões antigas.
  useEffect(() => {
    if (!hasLoadedRemoteData.current || !transactions.length) return;
    const existingIds = new Set(contracts.map((contract) => contract.id));
    const groups = new Map<string, Transaction[]>();
    transactions
      .filter((tx) => ['FINANCIAMENTO', 'EMPRESTIMO', 'CARNE', 'CONSORCIO'].includes(tx.origemFinanceira))
      .filter((tx) => tx.financiamentoDetalhes?.contratoId && !existingIds.has(tx.financiamentoDetalhes.contratoId))
      .forEach((tx) => {
        const id = tx.financiamentoDetalhes!.contratoId;
        groups.set(id, [...(groups.get(id) || []), tx]);
      });
    const latestByDebt = new Map<string, Transaction[]>();
    groups.forEach((items) => {
      const first = items[0];
      const title = first.descricao.replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();
      const key = `${first.financiamentoDetalhes!.instituicao.toLowerCase()}|${title.toLowerCase()}`;
      const existing = latestByDebt.get(key);
      const start = items.reduce((min, tx) => tx.data < min ? tx.data : min, first.data);
      const existingStart = existing?.reduce((min, tx) => tx.data < min ? tx.data : min, existing[0].data);
      if (!existing || start > existingStart!) latestByDebt.set(key, items);
    });
    const recovered: CreditContract[] = Array.from(latestByDebt.values()).map((items) => {
      const ordered = [...items].sort((a, b) => a.data.localeCompare(b.data));
      const first = ordered[0];
      const details = first.financiamentoDetalhes!;
      const firstInstallment = Math.min(...items.map((tx) => tx.financiamentoDetalhes?.parcelaAtual || 1));
      const explicitPaidItems = items.filter((tx) => tx.status === 'PAGO');
      const paidCount = Math.min(details.parcelasTotal, Math.max(0, firstInstallment - 1) + explicitPaidItems.length);
      const paidValue = Math.max(0, firstInstallment - 1) * first.valor + explicitPaidItems.reduce((sum, tx) => sum + tx.valor, 0);
      const title = first.descricao.replace(/\s*\(\d+\/\d+\)\s*$/, '').trim();
      return {
        id: details.contratoId, titulo: title, tipo: first.origemFinanceira as CreditContract['tipo'],
        instituicao: details.instituicao, valorTotal: details.valorTotalContrato,
        valorPago: paidValue, valorRestante: Math.max(0, details.valorTotalContrato - paidValue),
        parcelasTotal: details.parcelasTotal, parcelasPagas: paidCount, valorParcelaMensal: first.valor,
        taxaJurosAnual: details.taxaJurosAnual, cetMensal: details.cetMensal, cetAnual: details.cetAnual,
        proximoVencimento: ordered.find((tx) => tx.status !== 'PAGO')?.data || details.proximoVencimento || first.data,
        categoria: first.categoria, status: paidCount >= details.parcelasTotal ? 'LIQUIDADO' : 'EM_DIA',
      };
    });
    if (recovered.length) setContracts((previous) => [...previous, ...recovered.filter((item) => !previous.some((contract) => contract.id === item.id))]);
  }, [transactions, contracts]);

  // Materializa cobranças recorrentes de cartão somente quando a competência chega.
  // Nenhuma parcela futura é criada ou somada antecipadamente.
  useEffect(() => {
    if (!hasLoadedRemoteData.current || cards.length === 0) return;
    const today = new Date();
    const currentCompetence = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const recurringGroups = new Map<string, Transaction[]>();
    transactions.filter((tx) => tx.cartaoDetalhes?.recorrente && tx.cartaoDetalhes.recorrenciaAtiva !== false && tx.cartaoDetalhes.recorrenciaId)
      .forEach((tx) => {
        const key = tx.cartaoDetalhes!.recorrenciaId!;
        recurringGroups.set(key, [...(recurringGroups.get(key) || []), tx]);
      });
    const additions: Transaction[] = [];
    recurringGroups.forEach((items, recurrenceId) => {
      const card = resolveTransactionCard(items[0], cards);
      if (!card) return;
      const ordered = [...items].sort((a, b) => getTransactionInvoiceCompetence(a, card).localeCompare(getTransactionInvoiceCompetence(b, card)));
      let latest = ordered[ordered.length - 1];
      let competence = getTransactionInvoiceCompetence(latest, card);
      let occurrence = Math.max(...ordered.map((tx) => tx.cartaoDetalhes?.parcelaAtual || 1));
      while (competence < currentCompetence) {
        competence = addMonthsToCompetence(competence, 1);
        occurrence += 1;
        if (items.some((tx) => getTransactionInvoiceCompetence(tx, card) === competence) || additions.some((tx) => tx.cartaoDetalhes?.recorrenciaId === recurrenceId && tx.cartaoDetalhes?.competenciaFatura === competence)) continue;
        latest = {
          ...latest,
          id: `${recurrenceId}-${competence}`,
          data: getInvoiceDueDate(competence, card.vencimentoDia),
          status: 'PENDENTE',
          cartaoDetalhes: {
            ...latest.cartaoDetalhes!, cartaoId: card.id, cartaoNome: card.nome,
            parcelaAtual: occurrence, parcelasTotal: undefined, competenciaFatura: competence,
            recorrente: true, recorrenciaId: recurrenceId, recorrenciaAtiva: true,
          },
        };
        additions.push(latest);
      }
    });
    if (additions.length) setTransactions((previous) => [...additions, ...previous]);
  }, [transactions, cards]);

  useEffect(() => {
    if (!hasLoadedRemoteData.current) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 3);
    const dueAlerts: NotificationItem[] = getConsolidatedFlowItems(transactions, cards)
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
  }, [transactions, cards]);

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

  const deleteContractWithTransactions = async (id: string): Promise<boolean> => {
    const linkedTransactions = transactions.filter((tx) => tx.financiamentoDetalhes?.contratoId === id);
    const linkedIds = linkedTransactions.map((tx) => tx.id);
    if (isSupabaseConfigured) {
      const transactionsResult = await supabaseApi.deleteByIds('transactions', linkedIds);
      if (!transactionsResult.success) {
        console.error('Erro ao excluir parcelas do contrato:', transactionsResult.error);
        return false;
      }
      const contractResult = await supabaseApi.deleteById('credit_contracts', id);
      if (!contractResult.success) {
        console.error('Erro ao excluir contrato:', contractResult.error);
        return false;
      }
    }

    const balanceReversals = new Map<string, number>();
    linkedTransactions.forEach((tx) => {
      if (tx.status !== 'PAGO' || !tx.contaBancariaId) return;
      const reversal = tx.tipo === 'RECEITA' ? -tx.valor : tx.valor;
      balanceReversals.set(tx.contaBancariaId, (balanceReversals.get(tx.contaBancariaId) || 0) + reversal);
    });
    if (balanceReversals.size) {
      setBankAccounts((accounts) => accounts.map((account) => ({
        ...account,
        saldo: account.saldo + (balanceReversals.get(account.id) || 0),
      })));
    }
    setTransactions((previous) => previous.filter((tx) => !linkedIds.includes(tx.id)));
    setContracts((previous) => previous.filter((contract) => contract.id !== id));
    return true;
  };

  // Add Transaction
  const addTransaction = (txData: Omit<Transaction, 'id'>, generateInstallments = false) => {
    const id = createId('tx');
    let newTx: Transaction = { ...txData, id };
    if (newTx.origemFinanceira === 'CARTAO_CREDITO' && newTx.cartaoDetalhes) {
      const card = cards.find((item) => item.id === newTx.cartaoDetalhes!.cartaoId);
      const closingDay = newTx.cartaoDetalhes.melhorDiaCompra || card?.fechamentoDia || 1;
      const dueDay = newTx.cartaoDetalhes.diaVencimento || card?.vencimentoDia || 1;
      newTx = {
        ...newTx,
        cartaoDetalhes: {
          ...newTx.cartaoDetalhes,
          dataCompra: newTx.cartaoDetalhes.dataCompra || newTx.data,
          competenciaFatura: newTx.cartaoDetalhes.competenciaFatura || calculateInvoiceCompetence(newTx.data, closingDay, dueDay),
        },
      };
    }

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
      const valorParcela = Number((newTx.valor / totalP).toFixed(2));
      const baseCompetence = newTx.cartaoDetalhes.competenciaFatura!;

      for (let i = 1; i <= totalP; i++) {
        const pTx: Transaction = {
          ...newTx,
          id: `${id}-${i}`,
          valor: i === totalP ? Number((newTx.valor - valorParcela * (totalP - 1)).toFixed(2)) : valorParcela,
          data: newTx.cartaoDetalhes?.dataCompra || newTx.data,
          descricao: `${newTx.descricao} (${i}/${totalP})`,
          status: i === 1 ? newTx.status : 'AGENDADO',
          cartaoDetalhes: {
            ...newTx.cartaoDetalhes,
            parcelaAtual: i,
            parcelasTotal: totalP,
            competenciaFatura: addMonthsToCompetence(baseCompetence, i - 1),
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
      const firstInstallment = Math.min(Math.max(newTx.financiamentoDetalhes.parcelaAtual || 1, 1), total);
      const firstDueDate = newTx.financiamentoDetalhes.proximoVencimento || newTx.data;
      const baseDate = new Date(`${firstDueDate}T12:00:00`);
      for (let i = firstInstallment; i <= total; i += 1) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(baseDate.getMonth() + i - firstInstallment);
        newTxList.push({
          ...newTx,
          id: `${id}-${i}`,
          data: dueDate.toISOString().slice(0, 10),
          descricao: `${newTx.descricao} (${i}/${total})`,
          status: i === firstInstallment ? newTx.status : 'AGENDADO',
          financiamentoDetalhes: {
            ...newTx.financiamentoDetalhes,
            parcelaAtual: i,
          },
        });
      }
    } else if (newTx.custoFixoDetalhes?.ativo && newTx.custoFixoDetalhes.recorrencia !== 'UNICA') {
      // Custos fixos podem variar. Registra somente a competência informada;
      // nunca materializa ou soma automaticamente os meses futuros.
      newTxList = [newTx];
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

  const getNextOccurrenceDate = (dateStr: string, recurrence: RecorrenciaTipo): string => {
    const d = new Date(`${dateStr}T12:00:00`);
    if (recurrence === 'SEMANAL') {
      d.setDate(d.getDate() + 7);
    } else if (recurrence === 'TRIMESTRAL') {
      d.setMonth(d.getMonth() + 3);
    } else if (recurrence === 'ANUAL') {
      d.setFullYear(d.getFullYear() + 1);
    } else { // MENSAL
      d.setMonth(d.getMonth() + 1);
    }
    return d.toISOString().slice(0, 10);
  };

  // Update Transaction
  const updateTransaction = (id: string, updated: Partial<Transaction>) => {
    const current = transactions.find((tx) => tx.id === id);
    if (!current) return;
    let next = { ...current, ...updated };
    if (next.origemFinanceira === 'CARTAO_CREDITO' && next.cartaoDetalhes) {
      const card = cards.find((item) => item.id === next.cartaoDetalhes!.cartaoId);
      const existingCompetence = card ? getTransactionInvoiceCompetence(current, card) : current.cartaoDetalhes?.competenciaFatura;
      next = {
        ...next,
        cartaoDetalhes: {
          ...next.cartaoDetalhes,
          competenciaFatura: updated.cartaoDetalhes?.competenciaFatura
            || (updated.data
            ? calculateInvoiceCompetence(
                next.data,
                next.cartaoDetalhes.melhorDiaCompra || card?.fechamentoDia || 1,
                next.cartaoDetalhes.diaVencimento || card?.vencimentoDia || 1
              )
            : existingCompetence),
        },
      };
    }
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

    // Fixed cost propagation on PAGO transition
    let nextTxList: Transaction[] = [];
    if (
      next.status === 'PAGO' &&
      current.status !== 'PAGO' &&
      next.origemFinanceira === 'CUSTO_FIXO' &&
      next.custoFixoDetalhes?.ativo &&
      next.custoFixoDetalhes.recorrencia !== 'UNICA'
    ) {
      const nextDate = getNextOccurrenceDate(next.data, next.custoFixoDetalhes.recorrencia);
      const dataTermino = next.custoFixoDetalhes.dataTermino;
      const hasReachedEnd = dataTermino && nextDate > dataTermino;
      
      if (!hasReachedEnd) {
        const baseId = next.id.replace(/-\d+$/, '');
        const nextMonthStr = nextDate.slice(0, 7);
        const alreadyExists = transactions.some((t) =>
          t.origemFinanceira === 'CUSTO_FIXO' &&
          (t.id === baseId || t.id.startsWith(`${baseId}-`)) &&
          t.data.startsWith(nextMonthStr)
        );
        
        if (!alreadyExists) {
          const match = next.id.match(/-(\d+)$/);
          const currentIdx = match ? parseInt(match[1]) : 1;
          const nextIdx = currentIdx + 1;
          const nextId = `${baseId}-${nextIdx}`;
          
          const nextTx: Transaction = {
            ...next,
            id: nextId,
            status: 'PENDENTE',
            data: nextDate,
            custoFixoDetalhes: {
              ...next.custoFixoDetalhes,
              proximoVencimento: getNextOccurrenceDate(nextDate, next.custoFixoDetalhes.recorrencia),
            }
          };
          nextTxList.push(nextTx);
        }
      }
    }

    setTransactions((prev) => {
      const updatedList = prev.map((tx) => (tx.id === id ? next : tx));
      return [...nextTxList, ...updatedList];
    });
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

  const deleteTransactions = async (ids: string[]): Promise<boolean> => {
    const uniqueIds = Array.from(new Set(ids));
    if (!uniqueIds.length) return true;
    if (isSupabaseConfigured) {
      const result = await supabaseApi.deleteByIds('transactions', uniqueIds);
      if (!result.success) {
        console.error('Erro ao excluir lançamentos:', result.error);
        return false;
      }
    }
    const removed = transactions.filter((tx) => uniqueIds.includes(tx.id));
    const balanceReversals = new Map<string, number>();
    removed.forEach((tx) => {
      if (tx.status !== 'PAGO' || !tx.contaBancariaId) return;
      const reversal = tx.tipo === 'RECEITA' ? -tx.valor : tx.valor;
      balanceReversals.set(tx.contaBancariaId, (balanceReversals.get(tx.contaBancariaId) || 0) + reversal);
    });
    if (balanceReversals.size) {
      setBankAccounts((accounts) => accounts.map((account) => ({
        ...account,
        saldo: account.saldo + (balanceReversals.get(account.id) || 0),
      })));
    }
    setTransactions((previous) => previous.filter((tx) => !uniqueIds.includes(tx.id)));
    return true;
  };

  // Toggle Status
  const toggleTransactionStatus = (id: string) => {
    setTransactions((prev) => {
      const current = prev.find((tx) => tx.id === id);
      if (!current) return prev;
      
      const newStatus: TransactionStatus = current.status === 'PAGO' ? 'PENDENTE' : 'PAGO';

      // Update bank account if linked
      if (current.contaBancariaId) {
        const isNowPaid = newStatus === 'PAGO';
        const multiplier = isNowPaid ? 1 : -1;
        const delta = (current.tipo === 'RECEITA' ? current.valor : -current.valor) * multiplier;

        setBankAccounts((accounts) =>
          accounts.map((acc) =>
            acc.id === current.contaBancariaId ? { ...acc, saldo: acc.saldo + delta } : acc
          )
        );
      }

      let nextTxList: Transaction[] = [];
      if (
        newStatus === 'PAGO' &&
        current.origemFinanceira === 'CUSTO_FIXO' &&
        current.custoFixoDetalhes?.ativo &&
        current.custoFixoDetalhes.recorrencia !== 'UNICA'
      ) {
        const nextDate = getNextOccurrenceDate(current.data, current.custoFixoDetalhes.recorrencia);
        const dataTermino = current.custoFixoDetalhes.dataTermino;
        const hasReachedEnd = dataTermino && nextDate > dataTermino;
        
        if (!hasReachedEnd) {
          const baseId = current.id.replace(/-\d+$/, '');
          const nextMonthStr = nextDate.slice(0, 7);
          const alreadyExists = prev.some((t) =>
            t.origemFinanceira === 'CUSTO_FIXO' &&
            (t.id === baseId || t.id.startsWith(`${baseId}-`)) &&
            t.data.startsWith(nextMonthStr)
          );
          
          if (!alreadyExists) {
            const match = current.id.match(/-(\d+)$/);
            const currentIdx = match ? parseInt(match[1]) : 1;
            const nextIdx = currentIdx + 1;
            const nextId = `${baseId}-${nextIdx}`;
            
            const nextTx: Transaction = {
              ...current,
              id: nextId,
              status: 'PENDENTE',
              data: nextDate,
              custoFixoDetalhes: {
                ...current.custoFixoDetalhes,
                proximoVencimento: getNextOccurrenceDate(nextDate, current.custoFixoDetalhes.recorrencia),
              }
            };
            nextTxList.push(nextTx);
          }
        }
      }

      const updatedList = prev.map((tx) => (tx.id === id ? { ...tx, status: newStatus } : tx));
      return [...nextTxList, ...updatedList];
    });
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
  const payCardInvoice = (cardId: string, billingMonth?: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    const paymentAccount = bankAccounts.find((account) => account.ativa);
    if (!paymentAccount) {
      alert('Cadastre uma conta bancária ativa antes de quitar a fatura.');
      return;
    }

    const targetInvoice = billingMonth
      ? getOpenCardInvoices(transactions, cards).find((invoice) => invoice.cardId === cardId && invoice.competence === billingMonth)
      : getOpenCardInvoice(transactions, cards, cardId);
    const invoiceTransactions = targetInvoice?.transactions || [];
    const valorFatura = invoiceTransactions.reduce((sum, tx) => sum + tx.valor, 0);
    if (valorFatura <= 0) return;
    const invoiceTransactionIds = new Set(invoiceTransactions.map((tx) => tx.id));

    // Os próprios lançamentos do cartão formam o fluxo único. A quitação
    // baixa esses lançamentos na conta, sem criar uma segunda despesa.
    setTransactions((prev) =>
      prev.map((tx) => {
        if (invoiceTransactionIds.has(tx.id)) {
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
        deleteContractWithTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteTransactions,
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
