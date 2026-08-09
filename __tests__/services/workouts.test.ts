import type { Exercise, Workout } from '@/src/types';
import {
  createWorkout,
  deleteWorkout,
  getWorkoutDetail,
  listWorkouts,
  updateWorkout,
} from '@/src/services/workouts';

jest.mock('@/src/db/client');

type DbMock = typeof import('@/src/db/__mocks__/client');

function getDbMock(): DbMock {
  return jest.requireMock<DbMock>('@/src/db/client');
}

const workout: Workout = {
  id: 1,
  user_id: 1,
  title: 'Treino A',
  created_at: new Date('2026-01-01T10:00:00.000Z'),
};

const exercise: Exercise = {
  id: 1,
  workout_id: 1,
  name: 'Supino',
  planned_sets: 3,
  planned_reps: 10,
};

beforeEach(() => {
  getDbMock().resetDb();
});

describe('listWorkouts', () => {
  it('lista treinos do usuário com contagem de exercícios', async () => {
    getDbMock().setSelectResults(
      [workout],
      [exercise, { ...exercise, id: 2, name: 'Rosca' }],
    );

    const result = await listWorkouts(1);

    expect(result).toEqual([{ ...workout, exerciseCount: 2 }]);
  });

  it('retorna lista vazia quando não há treinos', async () => {
    getDbMock().setSelectResults([], []);

    const result = await listWorkouts(1);

    expect(result).toEqual([]);
  });
});

describe('getWorkoutDetail', () => {
  it('retorna treino com exercícios', async () => {
    getDbMock().setSelectResults([workout], [exercise]);

    const result = await getWorkoutDetail(1);

    expect(result).toEqual({ workout, exercises: [exercise] });
  });

  it('lança erro quando treino não existe', async () => {
    getDbMock().setSelectResults([], []);

    await expect(getWorkoutDetail(999)).rejects.toThrow('Treino não encontrado');
  });
});

describe('createWorkout', () => {
  it('cria treino e exercícios em transação', async () => {
    getDbMock().setInsertResult(workout);

    const result = await createWorkout({
      userId: 1,
      title: 'Treino A',
      exercises: [{ name: 'Supino', plannedSets: 3, plannedReps: 10 }],
    });

    expect(result).toEqual(workout);
    expect(getDbMock().mockDb.transaction).toHaveBeenCalled();
  });

  it('valida título em branco', async () => {
    await expect(
      createWorkout({ userId: 1, title: '   ', exercises: [] }),
    ).rejects.toThrow('Informe o nome do treino');
  });

  it('ignora exercícios sem nome', async () => {
    getDbMock().setInsertResult(workout);

    const result = await createWorkout({
      userId: 1,
      title: 'Treino A',
      exercises: [
        { name: '   ', plannedSets: 3, plannedReps: 10 },
        { name: 'Agachamento', plannedSets: 4, plannedReps: 8 },
      ],
    });

    expect(result).toEqual(workout);
  });
});

describe('updateWorkout', () => {
  it('atualiza título, remove exercícios antigos e insere novos', async () => {
    await updateWorkout({
      id: 1,
      title: 'Treino B',
      exercises: [{ name: 'Agachamento', plannedSets: 4, plannedReps: 8 }],
    });

    expect(getDbMock().mockDb.transaction).toHaveBeenCalled();
  });

  it('valida título em branco', async () => {
    await expect(
      updateWorkout({ id: 1, title: '  ', exercises: [] }),
    ).rejects.toThrow('Informe o nome do treino');
  });
});

describe('deleteWorkout', () => {
  it('remove o treino', async () => {
    await deleteWorkout(1);

    expect(getDbMock().mockDb.delete).toHaveBeenCalled();
  });
});