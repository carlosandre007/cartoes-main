import assert from 'node:assert/strict';
import test from 'node:test';
import { CreditContract, Transaction } from '../types';
import { getTotalFinancingDebt, getTotalFixedCostDebt } from './financialCalculations';

const fixed = (id: string, data: string, status: Transaction['status'], end?: string): Transaction => ({
  id, tipo: 'DESPESA', descricao: 'Aluguel', valor: 100, data, categoria: 'Moradia', empresa: 'Pessoal',
  centroCusto: 'Custos Fixos', formaPagamento: 'PIX', origemFinanceira: 'CUSTO_FIXO', status,
  custoFixoDetalhes: { recorrencia: 'MENSAL', recorrenciaId: 'rent', proximoVencimento: data, dataTermino: end, ativo: true },
});

test('dívida fixa não inclui competência paga nem duplica parcelas futuras', () => {
  const series = [
    fixed('rent-aug', '2026-08-10', 'PAGO', '2026-11-10'),
    fixed('rent-sep', '2026-09-10', 'PENDENTE', '2026-11-10'),
  ];
  assert.equal(getTotalFixedCostDebt(series, new Date(2026, 8, 1)), 300);
  assert.equal(getTotalFixedCostDebt([fixed('monthly', '2026-09-10', 'PAGO')], new Date(2026, 8, 1)), 0);
});

const contract = (id: string): CreditContract => ({
  id, titulo: id, tipo: 'FINANCIAMENTO', instituicao: 'Mesmo banco', valorTotal: 1000, valorPago: 400,
  valorRestante: 600, parcelasTotal: 10, parcelasPagas: 4, valorParcelaMensal: 100,
  taxaJurosAnual: 0, proximoVencimento: '2026-09-10', categoria: 'Financiamento', status: 'EM_DIA',
});

test('dois contratos legítimos com condições iguais são ambos somados', () => {
  assert.equal(getTotalFinancingDebt([], [contract('a'), contract('b')]), 1200);
  assert.equal(getTotalFinancingDebt([], [contract('a'), { ...contract('a'), valorRestante: 500 }]), 500);
});
