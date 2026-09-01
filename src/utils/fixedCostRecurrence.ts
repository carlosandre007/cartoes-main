import { RecorrenciaTipo, Transaction } from '../types';

export const getNextOccurrenceDate = (dateStr: string, recurrence: RecorrenciaTipo): string => {
  const date = new Date(`${dateStr}T12:00:00`);
  if (recurrence === 'SEMANAL') date.setDate(date.getDate() + 7);
  else {
    const originalDay = date.getDate();
    const monthsToAdd = recurrence === 'TRIMESTRAL' ? 3 : recurrence === 'ANUAL' ? 12 : 1;
    date.setDate(1);
    date.setMonth(date.getMonth() + monthsToAdd);
    const lastDayOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  }
  return date.toISOString().slice(0, 10);
};

const legacyBaseId = (id: string) => id.replace(/-\d+$/, '');

export const getFixedCostRecurrenceId = (transaction: Transaction) =>
  transaction.custoFixoDetalhes?.recorrenciaId || `fixed-${legacyBaseId(transaction.id)}`;

export const createNextFixedCostOccurrences = (paidTransitions: Transaction[], persisted: Transaction[]) =>
  paidTransitions.flatMap((paid) => {
    const details = paid.custoFixoDetalhes;
    if (!details?.ativo || details.recorrencia === 'UNICA' || paid.status !== 'PAGO') return [];
    const nextDate = getNextOccurrenceDate(paid.data, details.recorrencia);
    if (details.dataTermino && nextDate > details.dataTermino) return [];

    const recurrenceId = getFixedCostRecurrenceId(paid);
    const nextCompetence = details.recorrencia === 'SEMANAL' ? nextDate : nextDate.slice(0, 7);
    const baseId = legacyBaseId(paid.id);
    const alreadyExists = persisted.some((transaction) => {
      if (transaction.origemFinanceira !== 'CUSTO_FIXO') return false;
      const sameRecurrence = transaction.custoFixoDetalhes?.recorrenciaId === recurrenceId
        || transaction.id === baseId
        || transaction.id.startsWith(`${baseId}-`);
      const competence = details.recorrencia === 'SEMANAL' ? transaction.data : transaction.data.slice(0, 7);
      return sameRecurrence && competence === nextCompetence;
    });
    if (alreadyExists) return [];

    return [{
      ...paid,
      id: `${recurrenceId}-${nextDate}`,
      data: nextDate,
      status: 'PENDENTE' as const,
      custoFixoDetalhes: {
        ...details,
        recorrenciaId: recurrenceId,
        proximoVencimento: getNextOccurrenceDate(nextDate, details.recorrencia),
      },
    }];
  });
