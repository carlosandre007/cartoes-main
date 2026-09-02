export type TransactionType = 'RECEITA' | 'DESPESA';

export type TransactionStatus = 'PAGO' | 'PENDENTE' | 'AGENDADO' | 'AGUARDANDO' | 'CANCELADO';

export type OrigemFinanceira =
  | 'CONTA_BANCARIA'
  | 'CARTAO_CREDITO'
  | 'CUSTO_FIXO'
  | 'FINANCIAMENTO'
  | 'EMPRESTIMO'
  | 'CARNE'
  | 'CONSORCIO'
  | 'IMPOSTO'
  | 'INVESTIMENTO'
  | 'OUTRO';

export type RecorrenciaTipo = 'SEMANAL' | 'MENSAL' | 'TRIMESTRAL' | 'ANUAL' | 'UNICA';

export interface CartaoDetalhes {
  cartaoId: string;
  cartaoNome: string;
  parcelaAtual?: number;
  parcelasTotal?: number;
  melhorDiaCompra?: number;
  diaVencimento?: number;
  dataCompra?: string;
  competenciaFatura?: string;
  competenciaDefinidaEmLote?: boolean;
  recorrente?: boolean;
  recorrenciaId?: string;
  recorrenciaAtiva?: boolean;
  pagamentoFaturaId?: string;
  dataPagamentoFatura?: string;
}

export interface CustoFixoDetalhes {
  recorrencia: RecorrenciaTipo;
  recorrenciaId?: string;
  proximoVencimento: string; // ISO string YYYY-MM-DD
  dataTermino?: string; // ISO string YYYY-MM-DD
  ativo: boolean;
  dataPagamento?: string;
  valorPago?: number;
}

export interface FinanciamentoDetalhes {
  instituicao: string;
  valorTotalContrato: number;
  parcelasTotal: number;
  parcelaAtual: number;
  taxaJurosAnual: number;
  cetMensal?: number;
  cetAnual?: number;
  proximoVencimento?: string;
  contratoId: string;
}

export interface Transaction {
  id: string;
  tipo: TransactionType;
  descricao: string;
  valor: number;
  data: string; // YYYY-MM-DD
  categoria: string;
  empresa: string;
  centroCusto: string;
  formaPagamento: string;
  origemFinanceira: OrigemFinanceira;
  status: TransactionStatus;
  observacao?: string;

  // Conditional Fields based on Origem Financeira
  cartaoDetalhes?: CartaoDetalhes;
  custoFixoDetalhes?: CustoFixoDetalhes;
  financiamentoDetalhes?: FinanciamentoDetalhes;
  contaBancariaId?: string;
  contaBancariaNome?: string;
}

export interface CreditCard {
  id: string;
  nome: string;
  bandeira: 'VISA' | 'MASTERCARD' | 'AMEX' | 'AUREUM_BLACK';
  finalCartao: string;
  limiteTotal: number;
  limiteUtilizado: number;
  fechamentoDia: number;
  vencimentoDia: number;
  corGradiente: string;
  categoriaCard: 'AUREUM BLACK' | 'GRAPHITE RESERVE' | 'CORPORATE GOLD';
}

export interface CreditContract {
  id: string;
  titulo: string;
  tipo: 'FINANCIAMENTO' | 'EMPRESTIMO' | 'CARNE' | 'CONSORCIO';
  instituicao: string;
  valorTotal: number;
  valorPago: number;
  valorRestante: number;
  parcelasTotal: number;
  parcelasPagas: number;
  valorParcelaMensal: number;
  taxaJurosAnual: number;
  cetMensal?: number;
  cetAnual?: number;
  proximoVencimento: string;
  categoria: string;
  status: 'EM_DIA' | 'ATRASADO' | 'LIQUIDADO';
}

export interface BankAccount {
  id: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo: 'CORRENTE' | 'INVESTIMENTO' | 'POUPANCA' | 'PAYROLL';
  saldo: number;
  logoColor: string;
  ativa: boolean;
}

export interface FinancialGoal {
  id: string;
  titulo: string;
  categoria: string;
  valorAlvo: number;
  valorAtual: number;
  dataLimite: string;
  corIcone: string;
}

export interface NotificationItem {
  id: string;
  titulo: string;
  mensagem: string;
  data: string;
  lida: boolean;
  tipo: 'ALERTA' | 'INFO' | 'SUCESSO' | 'DÍVIDA';
}

export type ViewTab =
  | 'dashboard'
  | 'fluxo'
  | 'central'
  | 'cartoes'
  | 'custos-fixos'
  | 'credito'
  | 'bancos'
  | 'calendario'
  | 'saude'
  | 'quitacao'
  | 'relatorios'
  | 'inteligencia'
  | 'configuracoes'
  | 'controle'
  | 'impress3d';
