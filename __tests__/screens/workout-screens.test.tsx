import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import EditWorkoutScreen from '@/app/(tabs)/workout/[id]/edit';
import WorkoutDetailScreen from '@/app/(tabs)/workout/[id]/index';
import WorkoutRunScreen from '@/app/(tabs)/workout/[id]/run';
import WorkoutListScreen from '@/app/(tabs)/workout/index';
import NewWorkoutScreen from '@/app/(tabs)/workout/new';
import type { Exercise, ExerciseLog, Workout } from '@/src/types';

jest.mock('expo-router', () => ({
  Link: ({ children, href }: { children: ReactNode; href: unknown }) => <>{children}</>,
  Stack: () => null,
  useFocusEffect: (effect: () => void) => {
    effect();
  },
  useLocalSearchParams: () => ({ id: '1' }),
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/src/stores/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: { id: 1, name: 'Ana', password_hash: 'hash', created_at: new Date() },
      signIn: jest.fn(),
      signOut: jest.fn(),
    }),
}));

jest.mock('@/src/services/workouts', () => ({
  listWorkouts: jest.fn(async () => [mockWorkout]),
  getWorkoutDetail: jest.fn(async () => ({ workout: mockWorkout, exercises: [mockExercise] })),
  createWorkout: jest.fn(),
  updateWorkout: jest.fn(),
  deleteWorkout: jest.fn(),
}));

const mockWorkoutDelete = jest.mocked(
  jest.requireMock('@/src/services/workouts').deleteWorkout,
);

jest.mock('@/src/services/workout-execution', () => ({
  listExercisesWithLogs: jest.fn(async () => [
    {
      key: 'p-1',
      isExtra: false,
      exerciseId: 1,
      name: 'Supino',
      plannedSets: 3,
      plannedReps: 10,
      log: mockExerciseLog,
    },
  ]),
  upsertExerciseLog: jest.fn(),
  getWorkoutProgress: jest.fn(async () => ({ total: 1, done: 0 })),
}));

const mockWorkout: Workout = {
  id: 1,
  user_id: 1,
  title: 'Treino A',
  created_at: new Date('2026-01-01T10:00:00.000Z'),
};

const mockExercise: Exercise = {
  id: 1,
  workout_id: 1,
  name: 'Supino',
  planned_sets: 3,
  planned_reps: 10,
};

const mockExerciseLog: ExerciseLog = {
  id: 10,
  workout_id: null,
  exercise_id: 1,
  exercise_name: null,
  date: '2026-08-09',
  done: false,
  weight_used: null,
  actual_sets: null,
  actual_reps: null,
  notes: null,
};

describe('telas de treino', () => {
  it('renderiza a lista de treinos', async () => {
    render(<WorkoutListScreen />);

    expect(await screen.findByText('Treino A')).toBeTruthy();
    expect(screen.getByText('Treinos')).toBeTruthy();
    expect(screen.getByText('Novo')).toBeTruthy();
  });

  it('renderiza o formulário de novo treino', () => {
    render(<NewWorkoutScreen />);

    expect(screen.getByText('Novo treino')).toBeTruthy();
    expect(screen.getByText('Título')).toBeTruthy();
    expect(screen.getByText('+ Adicionar exercício')).toBeTruthy();
    expect(screen.getByText('Salvar')).toBeTruthy();
  });

  it('renderiza o detalhe do treino', async () => {
    render(<WorkoutDetailScreen />);

    expect(await screen.findByText('Treino A')).toBeTruthy();
    expect(screen.getByText('Supino')).toBeTruthy();
    expect(screen.getByText('Editar')).toBeTruthy();
    expect(screen.getByText('Excluir treino')).toBeTruthy();
  });

  it('renderiza o formulário de edição preenchido', async () => {
    render(<EditWorkoutScreen />);

    expect(await screen.findByDisplayValue('Supino')).toBeTruthy();
    expect(screen.getByText('Salvar')).toBeTruthy();
  });

  it('renderiza a tela de execução com o exercício do dia', async () => {
    render(<WorkoutRunScreen />);

    expect(await screen.findByText('Supino')).toBeTruthy();
    expect(screen.getByText('Marcar como feito')).toBeTruthy();
    expect(screen.getByText('+ Adicionar exercício extra')).toBeTruthy();
    expect(screen.getByText('Salvar')).toBeTruthy();
  });

  it('pede confirmação antes de excluir o treino', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    render(<WorkoutDetailScreen />);
    await screen.findByText('Treino A');

    fireEvent.press(screen.getByText('Excluir treino'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Excluir treino',
      expect.stringContaining('Treino A'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancelar', style: 'cancel' }),
        expect.objectContaining({ text: 'Excluir', style: 'destructive' }),
      ]),
    );
    expect(mockWorkoutDelete).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});