import type { Exercise, ExerciseLog } from '@/src/types';
import {
  getWorkoutProgress,
  listExercisesWithLogs,
  upsertExerciseLog,
} from '@/src/services/workout-execution';

jest.mock('@/src/db/client');

type DbMock = typeof import('@/src/db/__mocks__/client');

function getDbMock(): DbMock {
  return jest.requireMock<DbMock>('@/src/db/client');
}

const DATE = '2026-08-09';

const exerciseA: Exercise = {
  id: 1,
  workout_id: 1,
  name: 'Supino',
  planned_sets: 3,
  planned_reps: 10,
};

const exerciseB: Exercise = {
  id: 2,
  workout_id: 1,
  name: 'Agachamento',
  planned_sets: 4,
  planned_reps: 8,
};

const completedLog: ExerciseLog = {
  id: 10,
  exercise_id: 1,
  date: DATE,
  done: true,
  weight_used: 40,
  actual_sets: 3,
  actual_reps: 10,
  notes: null,
};

const pendingLog: ExerciseLog = {
  id: 11,
  exercise_id: 2,
  date: DATE,
  done: false,
  weight_used: null,
  actual_sets: null,
  actual_reps: null,
  notes: 'Perna fraca hoje',
};

beforeEach(() => {
  getDbMock().resetDb();
});

describe('listExercisesWithLogs', () => {
  it('retorna exercícios do treino com o log do dia', async () => {
    getDbMock().setSelectResults([exerciseA, exerciseB], [completedLog, pendingLog]);

    const result = await listExercisesWithLogs(1, DATE);

    expect(result).toEqual([
      { exercise: exerciseA, log: completedLog },
      { exercise: exerciseB, log: pendingLog },
    ]);
  });

  it('retorna log null quando o exercício ainda não foi registrado', async () => {
    getDbMock().setSelectResults([exerciseA], []);

    const result = await listExercisesWithLogs(1, DATE);

    expect(result).toEqual([{ exercise: exerciseA, log: null }]);
  });

  it('retorna lista vazia quando o treino não tem exercícios nem logs', async () => {
    getDbMock().setSelectResults([], []);

    const result = await listExercisesWithLogs(1, DATE);

    expect(result).toEqual([]);
  });
});

describe('upsertExerciseLog', () => {
  it('atualiza o log existente do exercício na data', async () => {
    getDbMock().setSelectResults([completedLog]);

    await upsertExerciseLog({
      exerciseId: 1,
      date: DATE,
      done: true,
      weightUsed: 45,
      actualSets: 3,
      actualReps: 10,
    });

    expect(getDbMock().mockDb.update).toHaveBeenCalled();
    expect(getDbMock().mockDb.insert).not.toHaveBeenCalled();
  });

  it('insere um novo log quando não existe registro', async () => {
    getDbMock().setSelectResults([]);

    await upsertExerciseLog({
      exerciseId: 1,
      date: DATE,
      done: true,
      weightUsed: 40,
      actualSets: 3,
      actualReps: 10,
      notes: 'Bom',
    });

    expect(getDbMock().mockDb.insert).toHaveBeenCalled();
    expect(getDbMock().mockDb.update).not.toHaveBeenCalled();
  });
});

describe('getWorkoutProgress', () => {
  it('conta exercícios totais e concluídos do dia', async () => {
    getDbMock().setSelectResults([exerciseA, exerciseB], [completedLog, pendingLog]);

    const result = await getWorkoutProgress(1, DATE);

    expect(result).toEqual({ total: 2, done: 1 });
  });

  it('retorna zero quando o treino não tem exercícios', async () => {
    getDbMock().setSelectResults([], []);

    const result = await getWorkoutProgress(1, DATE);

    expect(result).toEqual({ total: 0, done: 0 });
  });
});