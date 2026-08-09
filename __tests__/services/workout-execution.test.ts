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
  workout_id: null,
  exercise_id: 1,
  exercise_name: null,
  date: DATE,
  done: true,
  weight_used: 40,
  actual_sets: 3,
  actual_reps: '12, 10, 8',
  notes: null,
};

const pendingLog: ExerciseLog = {
  id: 11,
  workout_id: null,
  exercise_id: 2,
  exercise_name: null,
  date: DATE,
  done: false,
  weight_used: null,
  actual_sets: null,
  actual_reps: null,
  notes: 'Perna fraca hoje',
};

const extraLog: ExerciseLog = {
  id: 20,
  workout_id: 1,
  exercise_id: null,
  exercise_name: 'Barra fixa',
  date: DATE,
  done: true,
  weight_used: 0,
  actual_sets: 1,
  actual_reps: '8',
  notes: null,
};

beforeEach(() => {
  getDbMock().resetDb();
});

describe('listExercisesWithLogs', () => {
  it('retorna exercícios do treino e os extras do dia', async () => {
    getDbMock().setSelectResults([exerciseA, exerciseB], [completedLog], [extraLog]);

    const result = await listExercisesWithLogs(1, DATE);

    expect(result).toEqual([
      {
        key: 'p-1',
        isExtra: false,
        exerciseId: 1,
        name: 'Supino',
        plannedSets: 3,
        plannedReps: 10,
        log: completedLog,
      },
      {
        key: 'p-2',
        isExtra: false,
        exerciseId: 2,
        name: 'Agachamento',
        plannedSets: 4,
        plannedReps: 8,
        log: null,
      },
      {
        key: 'x-20',
        isExtra: true,
        exerciseId: null,
        name: 'Barra fixa',
        plannedSets: null,
        plannedReps: null,
        log: extraLog,
      },
    ]);
  });

  it('retorna com log null quando o exercício ainda não foi registrado', async () => {
    getDbMock().setSelectResults([exerciseA], []);

    const result = await listExercisesWithLogs(1, DATE);

    expect(result).toEqual([
      {
        key: 'p-1',
        isExtra: false,
        exerciseId: 1,
        name: 'Supino',
        plannedSets: 3,
        plannedReps: 10,
        log: null,
      },
    ]);
  });

  it('retorna lista vazia quando o treino não tem exercícios nem extras', async () => {
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
      actualReps: '12, 10, 8',
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
      actualReps: '12, 10, 8',
      notes: 'Bom',
    });

    expect(getDbMock().mockDb.insert).toHaveBeenCalled();
    expect(getDbMock().mockDb.update).not.toHaveBeenCalled();
  });

  it('calcula a quantidade de séries a partir das repetições separadas', async () => {
    getDbMock().setSelectResults([]);

    await upsertExerciseLog({
      exerciseId: 1,
      date: DATE,
      done: true,
      actualReps: '12, 10, 8',
    });

    const values = getDbMock().getInsertValues()[0];
    expect(values).toMatchObject({ actual_sets: 3, actual_reps: '12, 10, 8' });
  });

  it('insere um exercício extra com nome e vínculo ao treino', async () => {
    getDbMock().setSelectResults([]);

    await upsertExerciseLog({
      workoutId: 1,
      exerciseName: 'Barra fixa',
      date: DATE,
      done: true,
      actualReps: '8, 6',
    });

    const values = getDbMock().getInsertValues()[0];
    expect(values).toMatchObject({
      workout_id: 1,
      exercise_name: 'Barra fixa',
      actual_sets: 2,
    });
    expect(values).not.toHaveProperty('exercise_id');
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