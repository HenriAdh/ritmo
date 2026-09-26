import type { Meal, Workout } from '@/src/types';

const mockListWorkoutWeekdays = jest.fn<Promise<Record<number, unknown[]>>, [number]>();
const mockListMealWeekdays = jest.fn<Promise<Record<number, unknown[]>>, [number]>();

jest.mock('@/src/services/workout-plan', () => ({
  listWeekdayWorkouts: (userId: number) => mockListWorkoutWeekdays(userId),
}));

jest.mock('@/src/services/meal-plan', () => ({
  listWeekdayMeals: (userId: number) => mockListMealWeekdays(userId),
}));

jest.mock('@/src/db/client');

import { getDaySummary } from '@/src/services/day-summary';

type DbMock = typeof import('@/src/db/__mocks__/client');

function getDbMock(): DbMock {
  return jest.requireMock<DbMock>('@/src/db/client');
}

const DATE = '2026-09-26';

const workoutA: Workout = {
  id: 1,
  user_id: 1,
  title: 'Treino A',
  created_at: new Date('2026-01-01T10:00:00.000Z'),
};

const workoutB: Workout = {
  id: 2,
  user_id: 1,
  title: 'Treino B',
  created_at: new Date('2026-01-01T10:00:00.000Z'),
};

const mealA: Meal = { id: 1, user_id: 1, name: 'Café da manhã' };
const mealB: Meal = { id: 2, user_id: 1, name: 'Almoço' };

function exercise(id: number, workoutId: number) {
  return {
    id,
    workout_id: workoutId,
    name: `Exercício ${id}`,
    planned_sets: 3,
    planned_reps: 10,
  };
}

function log(id: number, exerciseId: number, done: boolean) {
  return {
    id,
    workout_id: null,
    exercise_id: exerciseId,
    exercise_name: null,
    date: DATE,
    done,
    weight_used: null,
    actual_sets: null,
    actual_reps: null,
    notes: null,
  };
}

function mealLog(mealId: number, status: string) {
  return { id: mealId, meal_id: mealId, date: DATE, status, notes: null };
}

beforeEach(() => {
  getDbMock().resetDb();
  mockListWorkoutWeekdays.mockReset();
  mockListMealWeekdays.mockReset();
  mockListWorkoutWeekdays.mockResolvedValue({});
  mockListMealWeekdays.mockResolvedValue({});
});

describe('getDaySummary', () => {
  it('devolve resumo vazio quando não há nada planejado para o dia', async () => {
    const summary = await getDaySummary(1, DATE, 5);

    expect(summary).toEqual({ items: [], next: null, total: 0, completed: 0 });
  });

  it('monta a agenda do dia juntando treino e refeição em ordem de horário', async () => {
    mockListWorkoutWeekdays.mockResolvedValue({ 5: [{ workout: workoutA, time: '19:00' }] });
    mockListMealWeekdays.mockResolvedValue({ 5: [{ meal: mealA, time: '07:15' }] });

    const summary = await getDaySummary(1, DATE, 5);

    expect(summary.items.map((item) => item.key)).toEqual(['meal-1', 'workout-1']);
    expect(summary.total).toBe(2);
  });

  it('ignora o que está planejado para outro dia da semana', async () => {
    mockListWorkoutWeekdays.mockResolvedValue({
      1: [{ workout: workoutA, time: '19:00' }],
      5: [{ workout: workoutB, time: '19:00' }],
    });

    const summary = await getDaySummary(1, DATE, 5);

    expect(summary.items.map((item) => item.id)).toEqual([2]);
  });

  describe('status das refeições', () => {
    beforeEach(() => {
      mockListMealWeekdays.mockResolvedValue({
        5: [
          { meal: mealA, time: '07:15' },
          { meal: mealB, time: '12:00' },
        ],
      });
    });

    it('trata refeição sem registro como pendente', async () => {
      getDbMock().setSelectResults([]);

      const summary = await getDaySummary(1, DATE, 5);

      expect(summary.items.map((item) => item.status)).toEqual(['pending', 'pending']);
    });

    it('mapeia comi tudo para concluído e parcial para parcial', async () => {
      getDbMock().setSelectResults([mealLog(1, 'eaten'), mealLog(2, 'partial')]);

      const summary = await getDaySummary(1, DATE, 5);

      expect(summary.items.map((item) => item.status)).toEqual(['done', 'partial']);
    });

    it('não deixa "não comi" virar a próxima atividade para sempre', async () => {
      getDbMock().setSelectResults([mealLog(1, 'eaten'), mealLog(2, 'not_eaten')]);

      const summary = await getDaySummary(1, DATE, 5);

      expect(summary.items.map((item) => item.status)).toEqual(['done', 'skipped']);
      expect(summary.next).toBeNull();
      expect(summary).toMatchObject({ total: 2, completed: 2 });
    });
  });

  describe('status dos treinos', () => {
    beforeEach(() => {
      mockListWorkoutWeekdays.mockResolvedValue({ 5: [{ workout: workoutA, time: '19:00' }] });
    });

    it('fica pendente quando nenhum exercício foi marcado', async () => {
      getDbMock().setSelectResults([], [exercise(10, 1), exercise(11, 1)], []);

      const summary = await getDaySummary(1, DATE, 5);

      expect(summary.items[0].status).toBe('pending');
    });

    it('fica parcial quando só parte dos exercícios foi marcada', async () => {
      getDbMock().setSelectResults(
        [],
        [exercise(10, 1), exercise(11, 1)],
        [log(1, 10, true), log(2, 11, false)],
      );

      const summary = await getDaySummary(1, DATE, 5);

      expect(summary.items[0].status).toBe('partial');
    });

    it('fica concluído quando todos os exercícios foram marcados', async () => {
      getDbMock().setSelectResults(
        [],
        [exercise(10, 1), exercise(11, 1)],
        [log(1, 10, true), log(2, 11, true)],
      );

      const summary = await getDaySummary(1, DATE, 5);

      expect(summary.items[0].status).toBe('done');
      expect(summary.next).toBeNull();
    });

    it('fica pendente quando o treino não tem exercício cadastrado', async () => {
      getDbMock().setSelectResults([], []);

      const summary = await getDaySummary(1, DATE, 5);

      expect(summary.items[0].status).toBe('pending');
    });

    it('conta os exercícios do treino certo quando vários estão no mesmo dia', async () => {
      mockListWorkoutWeekdays.mockResolvedValue({
        5: [
          { workout: workoutA, time: '07:00' },
          { workout: workoutB, time: '19:00' },
        ],
      });
      getDbMock().setSelectResults([], [exercise(10, 1), exercise(11, 2)], [log(1, 10, true)]);

      const summary = await getDaySummary(1, DATE, 5);

      expect(summary.items.map((item) => [item.title, item.status])).toEqual([
        ['Treino A', 'done'],
        ['Treino B', 'pending'],
      ]);
      expect(summary.next?.title).toBe('Treino B');
    });
  });

  it('aponta a próxima atividade para o primeiro pendente, pulando o que já foi feito', async () => {
    mockListWorkoutWeekdays.mockResolvedValue({ 5: [{ workout: workoutA, time: '19:00' }] });
    mockListMealWeekdays.mockResolvedValue({
      5: [
        { meal: mealA, time: '07:15' },
        { meal: mealB, time: '12:00' },
      ],
    });
    getDbMock().setSelectResults(
      [mealLog(1, 'eaten')],
      [exercise(10, 1), exercise(11, 1)],
      [log(1, 10, false), log(2, 11, false)],
    );

    const summary = await getDaySummary(1, DATE, 5);

    expect(summary.next?.key).toBe('meal-2');
    expect(summary).toMatchObject({ total: 3, completed: 1 });
  });

  it('ignora log de exercício que aponta para exercício removido', async () => {
    mockListWorkoutWeekdays.mockResolvedValue({ 5: [{ workout: workoutA, time: '19:00' }] });
    getDbMock().setSelectResults(
      [],
      [exercise(10, 1)],
      [log(1, 10, true), log(2, 99, true)],
    );

    const summary = await getDaySummary(1, DATE, 5);

    expect(summary.items[0].status).toBe('done');
  });
});
