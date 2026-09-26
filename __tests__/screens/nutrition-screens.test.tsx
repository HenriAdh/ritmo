import type { ReactNode } from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import EditMealScreen from '@/app/(tabs)/nutrition/[id]/edit';
import MealDetailScreen from '@/app/(tabs)/nutrition/[id]/index';
import MealRunScreen from '@/app/(tabs)/nutrition/[id]/run';
import MealListScreen from '@/app/(tabs)/nutrition/index';
import NewMealScreen from '@/app/(tabs)/nutrition/new';
import type { Ingredient, Meal, MealLog } from '@/src/types';
import type { MealDetail } from '@/src/services/meals';
import type { ScheduledDay } from '@/src/services/meal-plan';

jest.mock('expo-router', () => {
  const react = require('react');
  return {
    Link: ({ children, href }: { children: ReactNode; href: unknown }) => <>{children}</>,
    Stack: () => null,
    useFocusEffect: (effect: () => void) => {
      const ran = react.useRef(false);
      react.useEffect(() => {
        if (ran.current) return;
        ran.current = true;
        effect();
      }, []);
    },
    useLocalSearchParams: () => ({ id: '1' }),
    useRouter: () => ({
      back: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
    }),
  };
});

jest.mock('@/src/stores/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: { id: 1, name: 'Ana', password_hash: 'hash', created_at: new Date() },
      signIn: jest.fn(),
      signOut: jest.fn(),
    }),
}));

const mockMeal: Meal = { id: 1, user_id: 1, name: 'Arroz com feijão' };

const mockIngredient: Ingredient = {
  id: 1,
  meal_id: 1,
  name: 'Arroz',
  quantity: 100,
  unit: 'g',
};

const mockMealDetail: MealDetail = { meal: mockMeal, ingredients: [mockIngredient] };

const mockMealWeekdays: ScheduledDay[] = [
  { weekday: 0, time: '12:00' },
  { weekday: 4, time: null },
];

jest.mock('@/src/services/meals', () => ({
  listMeals: jest.fn(async () => [{ ...mockMeal, ingredientCount: 1 }]),
  getMealDetail: jest.fn(async () => mockMealDetail),
  createMeal: jest.fn(),
  updateMeal: jest.fn(),
  deleteMeal: jest.fn(),
}));

jest.mock('@/src/services/meal-plan', () => ({
  getMealWeekdays: jest.fn(async () => mockMealWeekdays),
  setMealWeekdays: jest.fn(),
}));

const mockMealDelete = jest.mocked(jest.requireMock('@/src/services/meals').deleteMeal);
const getMealWeekdaysMock = jest.mocked(
  jest.requireMock('@/src/services/meal-plan').getMealWeekdays,
);

const mockMealLog: MealLog = {
  id: 5,
  meal_id: 1,
  date: '2026-08-09',
  status: 'not_eaten',
  notes: null,
};

jest.mock('@/src/services/meal-execution', () => ({
  ...jest.requireActual('@/src/services/meal-execution'),
  listMealExecution: jest.fn(async () => ({
    log: mockMealLog,
    items: [
      {
        key: 'i-1',
        ingredientId: 1,
        name: 'Arroz',
        plannedQuantity: 100,
        unit: 'g',
        eatenQuantity: null,
      },
    ],
    extras: [],
  })),
  upsertMealLog: jest.fn(),
}));

const upsertMealLogMock = jest.mocked(
  jest.requireMock('@/src/services/meal-execution').upsertMealLog,
);

beforeEach(() => {
  getMealWeekdaysMock.mockImplementation(async () => mockMealWeekdays);
  upsertMealLogMock.mockClear();
});

describe('telas de alimentação', () => {
  it('renderiza a lista de refeições', async () => {
    render(<MealListScreen />);

    expect(await screen.findByText('Arroz com feijão')).toBeTruthy();
    expect(screen.getByText('1 ingrediente')).toBeTruthy();
    expect(screen.getByText('Refeições')).toBeTruthy();
    expect(screen.getByText('Nova')).toBeTruthy();
  });

  it('renderiza o formulário de nova refeição sem dia da semana', () => {
    render(<NewMealScreen />);

    expect(screen.getByText('Nova refeição')).toBeTruthy();
    expect(screen.getByText('Nome da refeição')).toBeTruthy();
    expect(screen.getByText('Ingredientes')).toBeTruthy();
    expect(screen.getByText('+ Adicionar ingrediente')).toBeTruthy();
    expect(screen.getByText('Salvar')).toBeTruthy();
    expect(screen.queryByText('Dia da semana')).toBeNull();
  });

  it('renderiza o detalhe da refeição com os dias vinculados', async () => {
    render(<MealDetailScreen />);

    expect(await screen.findByText('Arroz com feijão')).toBeTruthy();
    expect(await screen.findByText('Planejada em Segunda, Sexta')).toBeTruthy();
    expect(screen.getByText('Arroz')).toBeTruthy();
    expect(screen.getByText('100 g')).toBeTruthy();
    expect(screen.getByText('Registrar refeição')).toBeTruthy();
    expect(screen.getByText('Editar')).toBeTruthy();
    expect(screen.getByText('Excluir refeição')).toBeTruthy();
  });

  it('renderiza o detalhe avisando quando não há dia vinculado', async () => {
    getMealWeekdaysMock.mockImplementation(async () => []);

    render(<MealDetailScreen />);

    expect(await screen.findByText('Nenhum dia vinculado')).toBeTruthy();
  });

  it('renderiza o formulário de edição preenchido', async () => {
    render(<EditMealScreen />);

    expect(await screen.findByDisplayValue('Arroz com feijão')).toBeTruthy();
    expect(await screen.findByDisplayValue('Arroz')).toBeTruthy();
    expect(screen.getByText('Editar refeição')).toBeTruthy();
    expect(screen.getByText('Salvar')).toBeTruthy();
  });

  it('valida o nome vazio no formulário', async () => {
    render(<NewMealScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Ex.: Arroz, feijão e frango'), '   ');
    fireEvent.press(screen.getByText('Salvar'));

    expect(await screen.findByText('Informe o nome da refeição')).toBeTruthy();
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

  it('renderiza o registro da refeição com o botão de concluir e o campo por ingrediente', async () => {
    render(<MealRunScreen />);

    expect(await screen.findByText('Arroz com feijão')).toBeTruthy();
    expect(screen.getByText('Marcar como feito')).toBeTruthy();
    expect(screen.getByText('Planejado: 100 g')).toBeTruthy();
    expect(screen.getByPlaceholderText('Quanto comi (g)')).toBeTruthy();
    expect(screen.getByText('Registro: Não comi')).toBeTruthy();
    expect(screen.getByText('+ Adicionar ingrediente extra')).toBeTruthy();
    expect(screen.getByText('Salvar')).toBeTruthy();
  });

  it('salva a refeição marcada com a quantidade de cada ingrediente', async () => {
    render(<MealRunScreen />);
    await screen.findByText('Arroz com feijão');

    fireEvent.changeText(screen.getByPlaceholderText('Quanto comi (g)'), '60');
    fireEvent.press(screen.getByText('Marcar como feito'));

    expect(await screen.findByText('Registro: Comi parcialmente')).toBeTruthy();

    fireEvent.press(screen.getByText('Salvar'));

    expect(upsertMealLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ mealId: 1, done: true, items: [{ ingredientId: 1, quantity: 60 }] }),
    );
  });

  it('adiciona ingrediente extra e salva com nome e quantidade', async () => {
    render(<MealRunScreen />);
    await screen.findByText('Arroz com feijão');

    fireEvent.press(screen.getByText('+ Adicionar ingrediente extra'));

    expect(await screen.findByPlaceholderText('Nome do ingrediente extra')).toBeTruthy();
    expect(screen.getByText('Extra do dia')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('Nome do ingrediente extra'), 'Vitamina');
    fireEvent.changeText(screen.getByPlaceholderText('Quanto comi'), '200');
    fireEvent.press(screen.getByText('Salvar'));

    expect(upsertMealLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ extras: [{ name: 'Vitamina', quantity: 200 }] }),
    );
  });

  it('descarta o ingrediente extra removido antes de salvar', async () => {
    render(<MealRunScreen />);
    await screen.findByText('Arroz com feijão');

    fireEvent.press(screen.getByText('+ Adicionar ingrediente extra'));
    await screen.findByPlaceholderText('Nome do ingrediente extra');

    fireEvent.changeText(screen.getByPlaceholderText('Nome do ingrediente extra'), 'Vitamina');
    fireEvent.press(screen.getByText('Remover'));

    expect(screen.queryByPlaceholderText('Nome do ingrediente extra')).toBeNull();

    fireEvent.press(screen.getByText('Salvar'));

    expect(upsertMealLogMock).toHaveBeenCalledWith(expect.objectContaining({ extras: [] }));
  });
});
