import {
  ACTIVITY_ACTION_LABELS,
  DAY_STATUS_LABELS,
  activityRoute,
  applyCompletion,
  pickNextActivity,
  progressLabel,
  summarizeDay,
  type DayItemStatus,
  type DaySummaryItem,
} from '@/src/utils/day-summary';
import type { DayAgendaItem } from '@/src/utils/day-agenda';

function agendaItem(overrides: Partial<DayAgendaItem> = {}): DayAgendaItem {
  return {
    key: 'workout-1',
    kind: 'workout',
    id: 1,
    title: 'Treino A',
    time: '18:00',
    ...overrides,
  };
}

function summaryItem(
  status: DayItemStatus,
  overrides: Partial<DaySummaryItem> = {},
): DaySummaryItem {
  return { ...agendaItem(overrides), status };
}

describe('day-summary utils', () => {
  describe('applyCompletion', () => {
    it('aplica o status de cada item e mantém a ordem da agenda', () => {
      const agenda = [
        agendaItem({ key: 'workout-1', id: 1, time: '07:00' }),
        agendaItem({ key: 'meal-2', kind: 'meal', id: 2, title: 'Café', time: '07:15' }),
        agendaItem({ key: 'workout-3', id: 3, time: '19:00' }),
      ];

      const items = applyCompletion(agenda, {
        'workout-1': 'done',
        'meal-2': 'pending',
        'workout-3': 'partial',
      });

      expect(items.map((item) => item.status)).toEqual(['done', 'pending', 'partial']);
      expect(items.map((item) => item.key)).toEqual(['workout-1', 'meal-2', 'workout-3']);
    });

    it('trata item sem registro como pendente', () => {
      const items = applyCompletion([agendaItem({ key: 'workout-9' })], {});
      expect(items[0].status).toBe('pending');
    });
  });

  describe('pickNextActivity', () => {
    it('devolve o primeiro pendente em ordem de horário', () => {
      const next = pickNextActivity([
        summaryItem('done', { key: 'meal-1', time: '07:00' }),
        summaryItem('pending', { key: 'workout-2', time: '12:00' }),
        summaryItem('pending', { key: 'meal-3', time: '19:00' }),
      ]);

      expect(next?.key).toBe('workout-2');
    });

    it('ignora parcial e ignorado, que não voltam para a fila', () => {
      const next = pickNextActivity([
        summaryItem('partial', { key: 'meal-1' }),
        summaryItem('skipped', { key: 'workout-2' }),
      ]);

      expect(next).toBeNull();
    });

    it('devolve null quando não há pendência', () => {
      expect(pickNextActivity([summaryItem('done'), summaryItem('skipped')])).toBeNull();
    });

    it('devolve null com agenda vazia', () => {
      expect(pickNextActivity([])).toBeNull();
    });

    it('escolhe item sem horário quando é o único pendente', () => {
      const next = pickNextActivity([
        summaryItem('done', { key: 'meal-1', time: '07:00' }),
        summaryItem('pending', { key: 'workout-2', time: null }),
      ]);

      expect(next?.key).toBe('workout-2');
    });
  });

  describe('summarizeDay', () => {
    it('conta apenas o que não está pendente como concluído', () => {
      const totals = summarizeDay([
        summaryItem('done'),
        summaryItem('partial'),
        summaryItem('skipped'),
        summaryItem('pending'),
      ]);

      expect(totals).toEqual({ total: 4, completed: 3 });
    });

    it('chega ao total quando nada está pendente', () => {
      const totals = summarizeDay([summaryItem('done'), summaryItem('skipped')]);
      expect(totals).toEqual({ total: 2, completed: 2 });
    });

    it('zera com agenda vazia', () => {
      expect(summarizeDay([])).toEqual({ total: 0, completed: 0 });
    });
  });

  describe('activityRoute', () => {
    it('manda treino para a execução de treino', () => {
      const route = activityRoute(summaryItem('pending', { kind: 'workout', id: 7 }));
      expect(route).toEqual({ pathname: '/workout/[id]/run', params: { id: '7' } });
    });

    it('manda refeição para a execução de refeição', () => {
      const route = activityRoute(summaryItem('pending', { kind: 'meal', id: 3 }));
      expect(route).toEqual({ pathname: '/nutrition/[id]/run', params: { id: '3' } });
    });
  });

  describe('progressLabel', () => {
    it('usa plural acima de um item', () => {
      expect(progressLabel(3, 1)).toBe('1 de 3 concluídos');
    });

    it('usa singular com um item só', () => {
      expect(progressLabel(1, 0)).toBe('0 de 1 concluído');
    });
  });

  it('expõe labels de status e de ação', () => {
    expect(DAY_STATUS_LABELS).toEqual({
      pending: 'Pendente',
      done: 'Concluído',
      partial: 'Parcial',
      skipped: 'Ignorado',
    });
    expect(ACTIVITY_ACTION_LABELS.workout).toBe('Ir para o treino');
    expect(ACTIVITY_ACTION_LABELS.meal).toBe('Registrar refeição');
  });
});
