import { CreditCard, Transaction, TransactionType } from '../types';
import { getCanonicalTransactions, resolveTransactionCard } from './financialCalculations';

export type CashFlowOrigin = 'RECEITA_PESSOAL' | 'DESPESA_PESSOAL' | 'CUSTO_FIXO' | 'PAGAMENTO_CARTAO';

export interface RealizedCashFlowItem {
  id: string;
  sourceTransactionIds: string[];
  tipo: TransactionType;
  descricao: string;
  valor: number;
  dataEfetiva: string;
  categoria: string;
  formaPagamento: string;
  origem: CashFlowOrigin;
  observacao?: string;
  contaNome?: string;
  editable: boolean;
}

export interface CashFlowFilters {
  startDate?: string;
  endDate?: string;
  tipo?: TransactionType | 'TODOS';
  origem?: CashFlowOrigin | 'TODAS';
  search?: string;
}

const cents = (value: number) => Math.round(value * 100);
const money = (valueInCents: number) => valueInCents / 100;
const isManualPersonal = (tx: Transaction) =>
  tx.status === 'PAGO' &&
  tx.origemFinanceira === 'OUTRO' &&
  tx.centroCusto === 'Fluxo pessoal';

export const buildRealizedCashFlow = (transactions: Transaction[], cards: CreditCard[]): RealizedCashFlowItem[] => {
  const result: RealizedCashFlowItem[] = [];
  const cardPayments = new Map<string, Transaction[]>();

  getCanonicalTransactions(transactions).forEach((tx) => {
    if (isManualPersonal(tx)) {
      result.push({
        id: `manual-${tx.id}`, sourceTransactionIds: [tx.id], tipo: tx.tipo,
        descricao: tx.descricao, valor: money(cents(tx.valor)), dataEfetiva: tx.data,
        categoria: tx.categoria, formaPagamento: tx.formaPagamento,
        origem: tx.tipo === 'RECEITA' ? 'RECEITA_PESSOAL' : 'DESPESA_PESSOAL',
        observacao: tx.observacao, contaNome: tx.contaBancariaNome, editable: true,
      });
      return;
    }

    if (tx.origemFinanceira === 'CUSTO_FIXO' && tx.status === 'PAGO' && tx.custoFixoDetalhes?.dataPagamento) {
      result.push({
        id: `fixed-payment-${tx.id}`, sourceTransactionIds: [tx.id], tipo: 'DESPESA',
        descricao: tx.descricao, valor: money(cents(tx.custoFixoDetalhes.valorPago ?? tx.valor)),
        dataEfetiva: tx.custoFixoDetalhes.dataPagamento, categoria: tx.categoria,
        formaPagamento: tx.formaPagamento, origem: 'CUSTO_FIXO', observacao: tx.observacao,
        contaNome: tx.contaBancariaNome, editable: false,
      });
      return;
    }

    const paymentId = tx.cartaoDetalhes?.pagamentoFaturaId;
    if (tx.origemFinanceira === 'CARTAO_CREDITO' && tx.status === 'PAGO' && paymentId && tx.cartaoDetalhes?.dataPagamentoFatura) {
      cardPayments.set(paymentId, [...(cardPayments.get(paymentId) || []), tx]);
    }
  });

  cardPayments.forEach((items, paymentId) => {
    const first = items[0];
    const card = resolveTransactionCard(first, cards);
    result.push({
      id: paymentId, sourceTransactionIds: items.map((tx) => tx.id), tipo: 'DESPESA',
      descricao: `Pagamento da fatura ${card?.nome || first.cartaoDetalhes?.cartaoNome || 'Cartão'}`,
      valor: money(items.reduce((sum, tx) => sum + cents(tx.valor), 0)),
      dataEfetiva: first.cartaoDetalhes!.dataPagamentoFatura!, categoria: 'Pagamento de fatura',
      formaPagamento: first.contaBancariaNome || 'Conta bancária', origem: 'PAGAMENTO_CARTAO',
      contaNome: first.contaBancariaNome, editable: false,
    });
  });

  return result.sort((left, right) => right.dataEfetiva.localeCompare(left.dataEfetiva) || right.id.localeCompare(left.id));
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
