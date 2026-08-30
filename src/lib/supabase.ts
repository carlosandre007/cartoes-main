/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import {
  Transaction,
  CreditCard,
  CreditContract,
  BankAccount,
  FinancialGoal,
  NotificationItem,
} from '../types';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    typeof supabaseUrl === 'string' &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project') &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('example') &&
    supabaseAnonKey &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey !== 'your-anon-key' &&
    !supabaseAnonKey.includes('placeholder')
);

// Fallback client if credentials aren't set yet to avoid runtime crashes
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// ==============================================================================
// MAPPER HELPERS (CamelCase <-> Snake_Case)
// ==============================================================================

export const mapTransactionFromDB = (row: any): Transaction => ({
  id: row.id,
  tipo: row.tipo,
  descricao: row.descricao,
  valor: Number(row.valor),
  data: row.data,
  categoria: row.categoria,
  empresa: row.empresa || '',
  centroCusto: row.centro_custo || '',
  formaPagamento: row.forma_pagamento || '',
  origemFinanceira: row.origem_financeira,
  status: row.status,
  observacao: row.observacao || '',
  cartaoDetalhes: row.cartao_detalhes || undefined,
  custoFixoDetalhes: row.custo_fixo_detalhes || undefined,
  financiamentoDetalhes: row.financiamento_detalhes || undefined,
  contaBancariaId: row.conta_bancaria_id || undefined,
  contaBancariaNome: row.conta_bancaria_nome || undefined,
});

export const mapTransactionToDB = (tx: Transaction) => ({
  id: tx.id,
  tipo: tx.tipo,
  descricao: tx.descricao,
  valor: tx.valor,
  data: tx.data,
  categoria: tx.categoria,
  empresa: tx.empresa || null,
  centro_custo: tx.centroCusto || null,
  forma_pagamento: tx.formaPagamento || null,
  origem_financeira: tx.origemFinanceira,
  status: tx.status,
  observacao: tx.observacao || null,
  cartao_detalhes: tx.cartaoDetalhes || null,
  custo_fixo_detalhes: tx.custoFixoDetalhes || null,
  financiamento_detalhes: tx.financiamentoDetalhes || null,
  conta_bancaria_id: tx.contaBancariaId || null,
  conta_bancaria_nome: tx.contaBancariaNome || null,
});

export const mapCardFromDB = (row: any): CreditCard => ({
  id: row.id,
  nome: row.nome,
  bandeira: row.bandeira,
  finalCartao: row.final_cartao,
  limiteTotal: Number(row.limite_total),
  limiteUtilizado: Number(row.limite_utilizado),
  fechamentoDia: Number(row.fechamento_dia),
  vencimentoDia: Number(row.vencimento_dia),
  corGradiente: row.cor_gradiente || '',
  categoriaCard: row.categoria_card || 'AUREUM BLACK',
});

export const mapCardToDB = (card: CreditCard) => ({
  id: card.id,
  nome: card.nome,
  bandeira: card.bandeira,
  final_cartao: card.finalCartao,
  limite_total: card.limiteTotal,
  limite_utilizado: card.limiteUtilizado,
  fechamento_dia: card.fechamentoDia,
  vencimento_dia: card.vencimentoDia,
  cor_gradiente: card.corGradiente,
  categoria_card: card.categoriaCard,
});

export const mapContractFromDB = (row: any): CreditContract => ({
  id: row.id,
  titulo: row.titulo,
  tipo: row.tipo,
  instituicao: row.instituicao,
  valorTotal: Number(row.valor_total),
  valorPago: Number(row.valor_pago),
  valorRestante: Number(row.valor_restante),
  parcelasTotal: Number(row.parcelas_total),
  parcelasPagas: Number(row.parcelas_pagas),
  valorParcelaMensal: Number(row.valor_parcela_mensal),
  taxaJurosAnual: Number(row.taxa_juros_anual),
  cetMensal: Number(row.cet_mensal || 0),
  cetAnual: Number(row.cet_anual || 0),
  proximoVencimento: row.proximo_vencimento || '',
  categoria: row.categoria || '',
  status: row.status || 'EM_DIA',
});

export const mapContractToDB = (contract: CreditContract) => ({
  id: contract.id,
  titulo: contract.titulo,
  tipo: contract.tipo,
  instituicao: contract.instituicao,
  valor_total: contract.valorTotal,
  valor_pago: contract.valorPago,
  valor_restante: contract.valorRestante,
  parcelas_total: contract.parcelasTotal,
  parcelas_pagas: contract.parcelasPagas,
  valor_parcela_mensal: contract.valorParcelaMensal,
  taxa_juros_anual: contract.taxaJurosAnual,
  cet_mensal: contract.cetMensal || 0,
  cet_anual: contract.cetAnual || 0,
  proximo_vencimento: contract.proximoVencimento,
  categoria: contract.categoria,
  status: contract.status,
});

export const mapBankAccountFromDB = (row: any): BankAccount => ({
  id: row.id,
  banco: row.banco,
  agencia: row.agencia,
  conta: row.conta,
  tipo: row.tipo,
  saldo: Number(row.saldo),
  logoColor: row.logo_color || '#fbbf24',
  ativa: Boolean(row.ativa),
});

export const mapBankAccountToDB = (bank: BankAccount) => ({
  id: bank.id,
  banco: bank.banco,
  agencia: bank.agencia,
  conta: bank.conta,
  tipo: bank.tipo,
  saldo: bank.saldo,
  logo_color: bank.logoColor,
  ativa: bank.ativa,
});

export const mapGoalFromDB = (row: any): FinancialGoal => ({
  id: row.id,
  titulo: row.titulo,
  categoria: row.categoria,
  valorAlvo: Number(row.valor_alvo),
  valorAtual: Number(row.valor_atual),
  dataLimite: row.data_limite || '',
  corIcone: row.cor_icone || 'text-amber-400',
});

export const mapGoalToDB = (goal: FinancialGoal) => ({
  id: goal.id,
  titulo: goal.titulo,
  categoria: goal.categoria,
  valor_alvo: goal.valorAlvo,
  valor_atual: goal.valorAtual,
  data_limite: goal.dataLimite,
  cor_icone: goal.corIcone,
});

export const mapNotificationFromDB = (row: any): NotificationItem => ({
  id: row.id,
  titulo: row.titulo,
  mensagem: row.mensagem,
  data: row.data,
  lida: Boolean(row.lida),
  tipo: row.tipo,
});

export const mapNotificationToDB = (n: NotificationItem) => ({
  id: n.id,
  titulo: n.titulo,
  mensagem: n.mensagem,
  data: n.data,
  lida: n.lida,
  tipo: n.tipo,
});

// ==============================================================================
// SUPABASE AUTHENTICATION SERVICE
// ==============================================================================

export const supabaseAuth = {
  async signUp(email: string, pass: string) {
    if (!isSupabaseConfigured) return { user: null, error: 'Supabase not configured' };
    return await supabase.auth.signUp({ email, password: pass });
  },

  async signIn(email: string, pass: string) {
    if (!isSupabaseConfigured) return { user: null, error: 'Supabase not configured' };
    return await supabase.auth.signInWithPassword({ email, password: pass });
  },

  async signOut() {
    if (!isSupabaseConfigured) return;
    return await supabase.auth.signOut();
  },

  async getCurrentUser() {
    if (!isSupabaseConfigured) return null;
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  onAuthStateChange(callback: (user: any) => void) {
    if (!isSupabaseConfigured) return { unsubscribe: () => {} };
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
    return listener.subscription;
  },
};

// ==============================================================================
// SUPABASE DATABASE CRUD SERVICE
// ==============================================================================

export const supabaseApi = {
  async deleteById(table: string, id: string): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured) return { success: true };
    const { error } = await supabase.from(table).delete().eq('id', id);
    return error ? { success: false, error } : { success: true };
  },

  async deleteByIds(table: string, ids: string[]): Promise<{ success: boolean; error?: any }> {
    if (!ids.length || !isSupabaseConfigured) return { success: true };
    const { error } = await supabase.from(table).delete().in('id', ids);
    return error ? { success: false, error } : { success: true };
  },

  async deleteAll(table: string): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured) return { success: true };
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
    return error ? { success: false, error } : { success: true };
  },

  // TRANSACTIONS
  async getTransactions(): Promise<Transaction[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('data', { ascending: false });

      if (error) {
        console.error('[Supabase Error] getTransactions:', error);
        return [];
      }
      return (data || []).map(mapTransactionFromDB);
    } catch (err) {
      console.error('[Supabase Exception] getTransactions:', err);
      return [];
    }
  },

  async createTransaction(tx: Transaction): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured) {
      console.log('[Supabase Info] Supabase not configured, transaction saved locally.');
      return { success: true };
    }
    try {
      const dbRow = mapTransactionToDB(tx);
      const { data, error } = await supabase.from('transactions').insert(dbRow).select();
      if (error) {
        console.error('[Supabase Insert Error] createTransaction:', error);
        return { success: false, error };
      }
      console.log('[Supabase Success] Inserted transaction:', data);
      return { success: true };
    } catch (err) {
      console.error('[Supabase Exception] createTransaction:', err);
      return { success: false, error: err };
    }
  },

  async updateTransaction(id: string, updated: Partial<Transaction>): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured) return { success: true };
    try {
      const dbFields: any = {};
      if (updated.tipo) dbFields.tipo = updated.tipo;
      if (updated.descricao) dbFields.descricao = updated.descricao;
      if (updated.valor !== undefined) dbFields.valor = updated.valor;
      if (updated.data) dbFields.data = updated.data;
      if (updated.categoria) dbFields.categoria = updated.categoria;
      if (updated.empresa) dbFields.empresa = updated.empresa;
      if (updated.centroCusto) dbFields.centro_custo = updated.centroCusto;
      if (updated.formaPagamento) dbFields.forma_pagamento = updated.formaPagamento;
      if (updated.origemFinanceira) dbFields.origem_financeira = updated.origemFinanceira;
      if (updated.status) dbFields.status = updated.status;
      if (updated.observacao) dbFields.observacao = updated.observacao;
      if (updated.cartaoDetalhes) dbFields.cartao_detalhes = updated.cartaoDetalhes;

      const { error } = await supabase.from('transactions').update(dbFields).eq('id', id);
      if (error) {
        console.error('[Supabase Error] updateTransaction:', error);
        return { success: false, error };
      }
      return { success: true };
    } catch (err) {
      console.error('[Supabase Exception] updateTransaction:', err);
      return { success: false, error: err };
    }
  },

  async upsertTransactions(txs: Transaction[]): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured || !txs.length) return { success: true };
    try {
      const dbRows = txs.map(mapTransactionToDB);
      const { data, error } = await supabase.from('transactions').upsert(dbRows).select();
      if (error) {
        console.error('[Supabase Error] upsertTransactions:', error);
        return { success: false, error };
      }
      console.log(`[Supabase Success] Upserted ${txs.length} transactions:`, data);
      return { success: true };
    } catch (err) {
      console.error('[Supabase Exception] upsertTransactions:', err);
      return { success: false, error: err };
    }
  },

  async deleteTransaction(id: string): Promise<{ success: boolean; error?: any }> {
    return this.deleteById('transactions', id);
  },

  // CARDS
  async getCards(): Promise<CreditCard[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.from('credit_cards').select('*');
      if (error) {
        console.error('[Supabase Error] getCards:', error);
        return [];
      }
      return (data || []).map(mapCardFromDB);
    } catch (err) {
      console.error('[Supabase Exception] getCards:', err);
      return [];
    }
  },

  async upsertCards(cards: CreditCard[]): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured || !cards.length) return { success: true };
    try {
      const dbRows = cards.map(mapCardToDB);
      const { error } = await supabase.from('credit_cards').upsert(dbRows);
      if (error) {
        console.error('[Supabase Error] upsertCards:', error);
        return { success: false, error };
      }
      return { success: true };
    } catch (err) {
      console.error('[Supabase Exception] upsertCards:', err);
      return { success: false, error: err };
    }
  },

  // CONTRACTS
  async getContracts(): Promise<CreditContract[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.from('credit_contracts').select('*');
      if (error) {
        console.error('[Supabase Error] getContracts:', error);
        return [];
      }
      return (data || []).map(mapContractFromDB);
    } catch (err) {
      console.error('[Supabase Exception] getContracts:', err);
      return [];
    }
  },

  async upsertContracts(contracts: CreditContract[]): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured || !contracts.length) return { success: true };
    try {
      const dbRows = contracts.map(mapContractToDB);
      const { error } = await supabase.from('credit_contracts').upsert(dbRows);
      if (error) {
        // Compatibilidade com bancos criados antes dos campos de CET.
        const legacyRows = dbRows.map(({ cet_mensal: _cetMensal, cet_anual: _cetAnual, ...row }) => row);
        const { error: legacyError } = await supabase.from('credit_contracts').upsert(legacyRows);
        if (!legacyError) return { success: true };
        console.error('[Supabase Error] upsertContracts:', error);
        return { success: false, error: legacyError };
      }
      return { success: true };
    } catch (err) {
      console.error('[Supabase Exception] upsertContracts:', err);
      return { success: false, error: err };
    }
  },

  // BANK ACCOUNTS
  async getBankAccounts(): Promise<BankAccount[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.from('bank_accounts').select('*');
      if (error) {
        console.error('[Supabase Error] getBankAccounts:', error);
        return [];
      }
      return (data || []).map(mapBankAccountFromDB);
    } catch (err) {
      console.error('[Supabase Exception] getBankAccounts:', err);
      return [];
    }
  },

  async upsertBankAccounts(banks: BankAccount[]): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured || !banks.length) return { success: true };
    try {
      const dbRows = banks.map(mapBankAccountToDB);
      const { error } = await supabase.from('bank_accounts').upsert(dbRows);
      if (error) {
        console.error('[Supabase Error] upsertBankAccounts:', error);
        return { success: false, error };
      }
      return { success: true };
    } catch (err) {
      console.error('[Supabase Exception] upsertBankAccounts:', err);
      return { success: false, error: err };
    }
  },

  // FINANCIAL GOALS
  async getGoals(): Promise<FinancialGoal[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.from('financial_goals').select('*');
      if (error) {
        console.error('[Supabase Error] getGoals:', error);
        return [];
      }
      return (data || []).map(mapGoalFromDB);
    } catch (err) {
      console.error('[Supabase Exception] getGoals:', err);
      return [];
    }
  },

  async upsertGoals(goals: FinancialGoal[]): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured || !goals.length) return { success: true };
    try {
      const dbRows = goals.map(mapGoalToDB);
      const { error } = await supabase.from('financial_goals').upsert(dbRows);
      if (error) {
        console.error('[Supabase Error] upsertGoals:', error);
        return { success: false, error };
      }
      return { success: true };
    } catch (err) {
      console.error('[Supabase Exception] upsertGoals:', err);
      return { success: false, error: err };
    }
  },

  // NOTIFICATIONS
  async getNotifications(): Promise<NotificationItem[]> {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.from('notifications').select('*');
      if (error) {
        console.error('[Supabase Error] getNotifications:', error);
        return [];
      }
      return (data || []).map(mapNotificationFromDB);
    } catch (err) {
      console.error('[Supabase Exception] getNotifications:', err);
      return [];
    }
  },

  async upsertNotifications(notifications: NotificationItem[]): Promise<{ success: boolean; error?: any }> {
    if (!isSupabaseConfigured || !notifications.length) return { success: true };
    try {
      const dbRows = notifications.map(mapNotificationToDB);
      const { error } = await supabase.from('notifications').upsert(dbRows);
      if (error) {
        console.error('[Supabase Error] upsertNotifications:', error);
        return { success: false, error };
      }
      return { success: true };
    } catch (err) {
      console.error('[Supabase Exception] upsertNotifications:', err);
      return { success: false, error: err };
    }
  },
};

// ==============================================================================
// SUPABASE ANALYTICS VIEWS SERVICE
// ==============================================================================

export const supabaseAnalytics = {
  async getFinancialKPIs() {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('vw_financial_kpis').select('*').single();
      if (error) return null;
      return data;
    } catch {
      return null;
    }
  },

  async getCategoryExpenses() {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.from('vw_category_expenses').select('*');
      if (error) return [];
      return data;
    } catch {
      return [];
    }
  },

  async getUpcomingDues() {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.from('vw_upcoming_dues').select('*');
      if (error) return [];
      return data;
    } catch {
      return [];
    }
  },
};
