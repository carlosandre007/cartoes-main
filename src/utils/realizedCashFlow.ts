import { Transaction, TransactionType } from '../types';

export type CashFlowOrigin = 'RECEITA_PESSOAL' | 'DESPESA_PESSOAL' | 'CUSTO_FIXO' | 'PAGAMENTO_CARTAO';
export const AUREUM_FLOW_COST_CENTER = 'Fluxo Financeiro Aureum';
const AUTO_REFERENCE = /^\[AUREUM_FLOW:(CUSTO_FIXO|PAGAMENTO_CARTAO):([^\]]+)\](?:\s*)/;

export interface RealizedCashFlowItem {
  id: string; sourceTransactionIds: string[]; tipo: TransactionType; descricao: string;
  valor: number; dataEfetiva: string; categoria: string; empresa: string; formaPagamento: string;
  origem: CashFlowOrigin; observacao?: string; contaNome?: string; editable: boolean;
}
export interface CashFlowFilters {
  startDate?: string; endDate?: string; tipo?: TransactionType | 'TODOS';
  origem?: CashFlowOrigin | 'TODAS'; search?: string;
}

const cents = (value: number) => Math.round(value * 100);
const money = (valueInCents: number) => valueInCents / 100;

export const createAutomaticFlowTransaction = (
  origin: 'CUSTO_FIXO' | 'PAGAMENTO_CARTAO', reference: string,
  source: Pick<Transaction, 'descricao' | 'valor' | 'categoria' | 'empresa' | 'formaPagamento'>,
  paymentDate: string, extra?: { contaNome?: string; description?: string }
): Transaction => ({
  id: `aureum-flow-${origin.toLowerCase()}-${reference}`,
  tipo: 'DESPESA', descricao: extra?.description || source.descricao,
  valor: money(cents(source.valor)), data: paymentDate, categoria: source.categoria,
  empresa: source.empresa || 'Pessoal', centroCusto: AUREUM_FLOW_COST_CENTER,
  formaPagamento: source.formaPagamento || extra?.contaNome || 'Não informado',
  origemFinanceira: 'OUTRO', status: 'PAGO',
  observacao: `[AUREUM_FLOW:${origin}:${reference}]`, contaBancariaNome: extra?.contaNome,
});

// Somente registros materializados especificamente para esta aba entram no fluxo.
// Nenhum custo, cartão ou pagamento legado é inferido das demais áreas.
export const buildRealizedCashFlow = (transactions: Transaction[]): RealizedCashFlowItem[] => {
  const unique = new Map(transactions.map((tx) => [tx.id, tx]));
  return Array.from(unique.values()).filter((tx) =>
    tx.centroCusto === AUREUM_FLOW_COST_CENTER && tx.status === 'PAGO'
  ).map((tx) => {
    const reference = tx.observacao?.match(AUTO_REFERENCE);
    const origem: CashFlowOrigin = reference?.[1] as CashFlowOrigin
      || (tx.tipo === 'RECEITA' ? 'RECEITA_PESSOAL' : 'DESPESA_PESSOAL');
    return {
      id: tx.id, sourceTransactionIds: [tx.id], tipo: tx.tipo, descricao: tx.descricao,
      valor: money(cents(tx.valor)), dataEfetiva: tx.data, categoria: tx.categoria, empresa: tx.empresa,
      formaPagamento: tx.formaPagamento, origem,
      observacao: tx.observacao?.replace(AUTO_REFERENCE, ''), contaNome: tx.contaBancariaNome,
      editable: !reference,
    };
  }).sort((left, right) => right.dataEfetiva.localeCompare(left.dataEfetiva) || right.id.localeCompare(left.id));
};

export const filterRealizedCashFlow = (items: RealizedCashFlowItem[], filters: CashFlowFilters) => {
  const search = filters.search?.trim().toLocaleLowerCase('pt-BR') || '';
  return items.filter((item) =>
    (!filters.startDate || item.dataEfetiva >= filters.startDate) &&
    (!filters.endDate || item.dataEfetiva <= filters.endDate) &&
    (!filters.tipo || filters.tipo === 'TODOS' || item.tipo === filters.tipo) &&
    (!filters.origem || filters.origem === 'TODAS' || item.origem === filters.origem) &&
    (!search || `${item.descricao} ${item.categoria} ${item.observacao || ''}`.toLocaleLowerCase('pt-BR').includes(search))
  );
};

export const summarizeRealizedCashFlow = (items: RealizedCashFlowItem[]) => {
  const entradasCents = items.filter((item) => item.tipo === 'RECEITA').reduce((sum, item) => sum + cents(item.valor), 0);
  const saidasCents = items.filter((item) => item.tipo === 'DESPESA').reduce((sum, item) => sum + cents(item.valor), 0);
  return { entradas: money(entradasCents), saidas: money(saidasCents), resultado: money(entradasCents - saidasCents) };
};
