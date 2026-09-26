import { render, screen } from '@testing-library/react-native';

import PlanScreen from '@/app/(tabs)/plan/index';
import PlanWeekdayScreen from '@/app/(tabs)/plan/[weekday]';
import type { Meal } from '@/src/types';
import type { Workout } from '@/src/types';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: unknown }) => <>{children}</>,
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
    listWeekdayWorkouts: jest.fn(async () => ({
      0: [{ workout: mockWorkout, time: '18:00' }],
    })),
    listWorkoutsWithWeekdays: jest.fn(async () => [
      { workout: mockWorkout, weekdays: [{ weekday: 0, time: '18:00' }] },
    ]),
    setWorkoutWeekdays: jest.fn(async () => undefined),
  };
});

jest.mock('@/src/services/meal-plan', () => ({
  listWeekdayMeals: jest.fn(async () => ({
    0: [{ meal: mockMeal, time: '12:00' }],
  })),
  listMealsWithWeekdays: jest.fn(async () => [
    { meal: mockMeal, weekdays: [{ weekday: 0, time: '12:00' }] },
  ]),
  setMealWeekdays: jest.fn(async () => undefined),
}));

const mockWorkout: Workout = {
  id: 1,
  user_id: 1,
  title: 'Treino A',
  created_at: new Date('2026-01-01T10:00:00.000Z'),
};

const mockMeal: Meal = {
  id: 1,
  user_id: 1,
  name: 'Almoço',
};

describe('telas de planejamento', () => {
  it('renderiza a aba Planejar com o resumo semanal', async () => {
    render(<PlanScreen />);

    expect(await screen.findByText('Planejar')).toBeTruthy();
    expect(screen.getByText('Segunda')).toBeTruthy();
    expect(screen.getByText('Treino A')).toBeTruthy();
    expect(screen.getByText('18:00')).toBeTruthy();
    expect(screen.getByText('Treino')).toBeTruthy();
  });

  it('renderiza as refeições no resumo semanal', async () => {
    render(<PlanScreen />);

    expect(await screen.findByText('Almoço')).toBeTruthy();
    expect(screen.getByText('12:00')).toBeTruthy();
    expect(screen.getByText('Refeição')).toBeTruthy();
    expect(screen.getByText('2 itens')).toBeTruthy();
  });

  it('renderiza a tela de um dia com as seções e o treino marcado', async () => {
    render(<PlanWeekdayScreen />);

    expect(await screen.findByText('Segunda')).toBeTruthy();
    expect(screen.getByText('Treino')).toBeTruthy();
    expect(screen.getByText('Cozinha')).toBeTruthy();
    expect(screen.getByText('Compras')).toBeTruthy();
    expect(screen.getByText('Treino A')).toBeTruthy();
    expect(screen.getByText('Salvar')).toBeTruthy();
  });

  it('renderiza a seção Alimentação com a refeição marcada e o horário', async () => {
    render(<PlanWeekdayScreen />);

    expect(await screen.findByText('Alimentação')).toBeTruthy();
    expect(screen.getByText('Almoço')).toBeTruthy();
    expect(screen.getByDisplayValue('12:00')).toBeTruthy();
  });
});
