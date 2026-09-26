import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import EditMealScreen from '@/app/(tabs)/nutrition/[id]/edit';
import MealDetailScreen from '@/app/(tabs)/nutrition/[id]/index';
import MealListScreen from '@/app/(tabs)/nutrition/index';
import NewMealScreen from '@/app/(tabs)/nutrition/new';
import type { Ingredient, Meal } from '@/src/types';

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

jest.mock('@/src/services/meals', () => ({
  isValidTime: jest.requireActual('@/src/services/meals').isValidTime,
  listMealsByWeekday: jest.fn(async () => ({
    0: [{ ...mockMeal, ingredientCount: 1 }],
  })),
  getMealDetail: jest.fn(async () => ({ meal: mockMeal, ingredients: [mockIngredient] })),
  createMeal: jest.fn(),
  updateMeal: jest.fn(),
  deleteMeal: jest.fn(),
}));

const mockMealDelete = jest.mocked(jest.requireMock('@/src/services/meals').deleteMeal);

const mockMeal: Meal = {
  id: 1,
  user_id: 1,
  name: 'Arroz com feijão',
  time: '12:00',
  weekday: 0,
};

const mockIngredient: Ingredient = {
  id: 1,
  meal_id: 1,
  name: 'Arroz',
  quantity: 100,
  unit: 'g',
};

describe('telas de alimentação', () => {
  it('renderiza a lista de refeições agrupada por dia', async () => {
    render(<MealListScreen />);

    expect(await screen.findByText('Arroz com feijão')).toBeTruthy();
    expect(screen.getByText('Segunda')).toBeTruthy();
    expect(screen.getByText('12:00')).toBeTruthy();
    expect(screen.getByText('Nova refeição')).toBeTruthy();
  });

  it('renderiza o formulário de nova refeição', () => {
    render(<NewMealScreen />);

    expect(screen.getByText('Nome da refeição')).toBeTruthy();
    expect(screen.getByText('Horário')).toBeTruthy();
    expect(screen.getByText('Dia da semana')).toBeTruthy();
    expect(screen.getByText('+ Adicionar ingrediente')).toBeTruthy();
    expect(screen.getByText('Salvar')).toBeTruthy();
  });

  it('renderiza o detalhe da refeição com dia e horário', async () => {
    render(<MealDetailScreen />);

    expect(await screen.findByText('Arroz com feijão')).toBeTruthy();
    expect(screen.getByText('Segunda')).toBeTruthy();
    expect(screen.getByText('Arroz')).toBeTruthy();
    expect(screen.getByText('100 g')).toBeTruthy();
    expect(screen.getByText('Editar')).toBeTruthy();
    expect(screen.getByText('Excluir refeição')).toBeTruthy();
  });

  it('renderiza o formulário de edição preenchido', async () => {
    render(<EditMealScreen />);

    expect(await screen.findByDisplayValue('Arroz com feijão')).toBeTruthy();
    expect(await screen.findByDisplayValue('12:00')).toBeTruthy();
    expect(await screen.findByDisplayValue('Arroz')).toBeTruthy();
    expect(screen.getByText('Salvar')).toBeTruthy();
  });

  it('valida o horário inválido no formulário', async () => {
    render(<NewMealScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Ex.: Arroz, feijão e frango'), 'Almoço');
    fireEvent.changeText(screen.getByPlaceholderText('12:00'), '25:00');
    fireEvent.press(screen.getByText('Salvar'));

    expect(
      await screen.findByText('Informe um horário válido no formato HH:MM'),
    ).toBeTruthy();
  });

  it('pede confirmação antes de excluir a refeição', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    render(<MealDetailScreen />);
    await screen.findByText('Arroz com feijão');

    fireEvent.press(screen.getByText('Excluir refeição'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Excluir refeição',
      expect.stringContaining('Arroz com feijão'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancelar', style: 'cancel' }),
        expect.objectContaining({ text: 'Excluir', style: 'destructive' }),
      ]),
    );
    expect(mockMealDelete).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
