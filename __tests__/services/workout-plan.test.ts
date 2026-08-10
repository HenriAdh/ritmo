import type { Workout } from '@/src/types';
import {
  getWorkoutWeekdays,
  listWeekdayWorkouts,
  listWorkoutsWithWeekdays,
  removeWorkoutFromWeekday,
  setWorkoutWeekdays,
  weekdayName,
} from '@/src/services/workout-plan';

jest.mock('@/src/db/client');

type DbMock = typeof import('@/src/db/__mocks__/client');

function getDbMock(): DbMock {
  return jest.requireMock<DbMock>('@/src/db/client');
}

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

beforeEach(() => {
  getDbMock().resetDb();
});

describe('getWorkoutWeekdays', () => {
  it('retorna os dias e horários vinculados ao treino', async () => {
    getDbMock().setSelectResults([
      { id: 1, workout_id: 1, weekday: 0, time: '18:00' },
      { id: 2, workout_id: 1, weekday: 4, time: null },
    ]);

    const result = await getWorkoutWeekdays(1);

    expect(result).toEqual([
      { weekday: 0, time: '18:00' },
      { weekday: 4, time: null },
    ]);
  });
});

describe('setWorkoutWeekdays', () => {
  it('substitui os dias e remove duplicados em transação', async () => {
    await setWorkoutWeekdays(1, [
      { weekday: 2, time: '18:00' },
      { weekday: 2, time: '19:00' },
      { weekday: 5, time: null },
    ]);

    expect(getDbMock().mockDb.transaction).toHaveBeenCalled();
    expect(getDbMock().mockDb.delete).toHaveBeenCalled();
    expect(getDbMock().getInsertValues()).toHaveLength(2);
    expect(getDbMock().getInsertValues()).toEqual([
      { workout_id: 1, weekday: 2, time: '19:00' },
      { workout_id: 1, weekday: 5, time: null },
    ]);
  });
});

describe('listWeekdayWorkouts', () => {
  it('agrupa treinos por dia da semana com horário', async () => {
    getDbMock().setSelectResults([workoutA, workoutB], [
      { id: 1, workout_id: 1, weekday: 0, time: '18:00' },
      { id: 2, workout_id: 1, weekday: 4, time: null },
      { id: 3, workout_id: 2, weekday: 4, time: '07:00' },
    ]);

    const result = await listWeekdayWorkouts(1);

    expect(result[0]).toEqual([{ workout: workoutA, time: '18:00' }]);
    expect(result[4]).toEqual([
      { workout: workoutA, time: null },
      { workout: workoutB, time: '07:00' },
    ]);
    expect(result[1]).toBeUndefined();
  });
});

describe('listWorkoutsWithWeekdays', () => {
  it('retorna cada treino com seus dias e horários', async () => {
    getDbMock().setSelectResults([workoutA, workoutB], [
      { id: 1, workout_id: 1, weekday: 0, time: '18:00' },
      { id: 2, workout_id: 1, weekday: 4, time: null },
    ]);

    const result = await listWorkoutsWithWeekdays(1);

    expect(result).toEqual([
      {
        workout: workoutA,
        weekdays: [
          { weekday: 0, time: '18:00' },
          { weekday: 4, time: null },
        ],
      },
      { workout: workoutB, weekdays: [] },
    ]);
  });
});

describe('removeWorkoutFromWeekday', () => {
  it('remove o vínculo do treino com o dia', async () => {
    await removeWorkoutFromWeekday(1, 4);

    expect(getDbMock().mockDb.delete).toHaveBeenCalled();
  });
});

describe('weekdayName', () => {
  it('retorna o nome do dia por índice', () => {
    expect(weekdayName(0)).toBe('Segunda');
    expect(weekdayName(6)).toBe('Domingo');
  });
});