import type { DayAgendaItem, DayAgendaKind } from '@/src/utils/day-agenda';

export type DayItemStatus = 'pending' | 'done' | 'partial' | 'skipped';

export type DaySummaryItem = DayAgendaItem & {
  status: DayItemStatus;
};

export type DaySummary = {
  items: DaySummaryItem[];
  next: DaySummaryItem | null;
  total: number;
  completed: number;
};

export const DAY_STATUS_LABELS: Record<DayItemStatus, string> = {
  pending: 'Pendente',
  done: 'Concluído',
  partial: 'Parcial',
  skipped: 'Ignorado',
};

export const ACTIVITY_ACTION_LABELS: Record<DayAgendaKind, string> = {
  workout: 'Ir para o treino',
  meal: 'Registrar refeição',
};

export function applyCompletion(
  agenda: readonly DayAgendaItem[],
  completion: Readonly<Record<string, DayItemStatus>>,
): DaySummaryItem[] {
  return agenda.map((item) => ({ ...item, status: completion[item.key] ?? 'pending' }));
}

// Só o que ainda não foi registrado conta como próxima atividade. Parcial e
// ignorado saem da fila: se voltassem, um almoço marcado como "comi
// parcialmente" seria sugerido de novo toda vez que a Home abrisse.
export function pickNextActivity(items: readonly DaySummaryItem[]): DaySummaryItem | null {
  return items.find((item) => item.status === 'pending') ?? null;
}

// completed conta tudo que não está pendente, para o contador chegar ao total
// exatamente quando não sobrar nada para fazer.
export function summarizeDay(items: readonly DaySummaryItem[]): {
  total: number;
  completed: number;
} {
  return {
    total: items.length,
    completed: items.filter((item) => item.status !== 'pending').length,
  };
}

export function activityRoute(item: DaySummaryItem) {
  return item.kind === 'workout'
    ? ({ pathname: '/workout/[id]/run', params: { id: String(item.id) } } as const)
    : ({ pathname: '/nutrition/[id]/run', params: { id: String(item.id) } } as const);
}

export function progressLabel(total: number, completed: number): string {
  return `${completed} de ${total} ${total === 1 ? 'concluído' : 'concluídos'}`;
}
