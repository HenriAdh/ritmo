import { render, screen } from '@testing-library/react-native';

import HomeScreen from '@/app/(tabs)/index';
import PlanWeekdayScreen from '@/app/(tabs)/plan/[weekday]';
import type { Workout } from '@/src/types';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => ({ weekday: '0' }),
  useFocusEffect: (effect: () => void) => {
    effect();
  },
}));

jest.mock('@/src/stores/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: { id: 1, name: 'Ana', password_hash: 'hash', created_at: new Date() },
    }),
}));

jest.mock('@/src/services/workout-plan', () => {
  const actual = jest.requireActual('@/src/services/workout-plan');
  return {
    ...actual,
    listWeekdayWorkouts: jest.fn(async () => ({ 0: [mockWorkout] })),
    listWorkoutsWithWeekdays: jest.fn(async () => [
      { workout: mockWorkout, weekdays: [0] },
    ]),
    setWorkoutWeekdays: jest.fn(async () => undefined),
  };
});

const mockWorkout: Workout = {
  id: 1,
  user_id: 1,
  title: 'Treino A',
  created_at: new Date('2026-01-01T10:00:00.000Z'),
};

describe('telas de planejamento', () => {
  it('renderiza a home com o planejamento semanal', async () => {
    render(<HomeScreen />);

    expect(await screen.findByText('Planejamento da semana')).toBeTruthy();
    expect(screen.getByText('Segunda')).toBeTruthy();
    expect(screen.getByText('Treino A')).toBeTruthy();
  });

  it('renderiza a tela de um dia com o treino marcado', async () => {
    render(<PlanWeekdayScreen />);

    expect(await screen.findByText('Segunda')).toBeTruthy();
    expect(screen.getByText('Treino A')).toBeTruthy();
    expect(screen.getByText('Salvar planejamento')).toBeTruthy();
  });
});