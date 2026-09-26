import type { Ingredient, Meal } from '@/src/types';
import {
  createMeal,
  deleteMeal,
  getMealDetail,
  isValidTime,
  listMealsByWeekday,
  updateMeal,
} from '@/src/services/meals';

jest.mock('@/src/db/client');

type DbMock = typeof import('@/src/db/__mocks__/client');

function getDbMock(): DbMock {
  return jest.requireMock<DbMock>('@/src/db/client');
}

function makeMeal(overrides: Partial<Meal> = {}): Meal {
  return {
    id: 1,
    user_id: 1,
    name: 'Arroz com feijão',
    time: '12:00',
    weekday: 0,
    ...overrides,
  };
}

function makeIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id: 1,
    meal_id: 1,
    name: 'Arroz',
    quantity: 100,
    unit: 'g',
    ...overrides,
  };
}

beforeEach(() => {
  getDbMock().resetDb();
});

describe('listMealsByWeekday', () => {
  it('agrupa por dia da semana e ordena por horário', async () => {
    getDbMock().setSelectResults(
      [
        makeMeal({ id: 1, weekday: 0, time: '12:00' }),
        makeMeal({ id: 2, weekday: 0, time: '08:00', name: 'Café' }),
        makeMeal({ id: 3, weekday: 3, time: '20:00', name: 'Jantar' }),
      ],
      [makeIngredient({ id: 1, meal_id: 1 }), makeIngredient({ id: 2, meal_id: 1 })],
    );

    const result = await listMealsByWeekday(1);

    expect(result[0]?.map((meal) => meal.id)).toEqual([2, 1]);
    expect(result[3]?.map((meal) => meal.id)).toEqual([3]);
    expect(result[1]).toBeUndefined();
  });

  it('conta os ingredientes de cada refeição', async () => {
    getDbMock().setSelectResults(
      [makeMeal({ id: 1, weekday: 2 })],
      [
        makeIngredient({ id: 1, meal_id: 1 }),
        makeIngredient({ id: 2, meal_id: 1 }),
        makeIngredient({ id: 3, meal_id: 9 }),
      ],
    );

    const result = await listMealsByWeekday(1);

    expect(result[2]?.[0]?.ingredientCount).toBe(2);
  });

  it('devolve contagem zero para refeição sem ingredientes', async () => {
    getDbMock().setSelectResults([makeMeal({ id: 1, weekday: 0 })], []);

    const result = await listMealsByWeekday(1);

    expect(result[0]?.[0]?.ingredientCount).toBe(0);
  });
});

describe('getMealDetail', () => {
  it('retorna a refeição com seus ingredientes', async () => {
    const meal = makeMeal();
    getDbMock().setSelectResults([meal], [makeIngredient()]);

    const result = await getMealDetail(1);

    expect(result.meal).toEqual(meal);
    expect(result.ingredients).toHaveLength(1);
  });

  it('lança quando a refeição não existe', async () => {
    getDbMock().setSelectResults([]);

    await expect(getMealDetail(99)).rejects.toThrow('Refeição não encontrada');
  });
});

describe('createMeal', () => {
  it('valida nome, horário e dia da semana', async () => {
    await expect(
      createMeal({ userId: 1, name: '  ', time: '12:00', weekday: 0, ingredients: [] }),
    ).rejects.toThrow('Informe o nome da refeição');

    await expect(
      createMeal({ userId: 1, name: 'Almoço', time: '25:00', weekday: 0, ingredients: [] }),
    ).rejects.toThrow('Informe um horário válido no formato HH:MM');

    await expect(
      createMeal({ userId: 1, name: 'Almoço', time: '12:00', weekday: 7, ingredients: [] }),
    ).rejects.toThrow('Selecione o dia da semana');
  });

  it('grava a refeição e os ingredientes em transação', async () => {
    const meal = makeMeal({ name: 'Almoço' });
    getDbMock().setInsertResult(meal);

    const result = await createMeal({
      userId: 1,
      name: '  Almoço  ',
      time: '12:00',
      weekday: 0,
      ingredients: [{ name: 'Arroz' }, { name: 'Feijão', quantity: 80, unit: 'g' }],
    });

    expect(getDbMock().mockDb.transaction).toHaveBeenCalled();
    expect(result.name).toBe('Almoço');
    expect(getDbMock().getInsertValues()[0]).toEqual({
      user_id: 1,
      name: 'Almoço',
      time: '12:00',
      weekday: 0,
    });
    expect(getDbMock().getInsertValues().slice(1)).toEqual([
      { meal_id: 1, name: 'Arroz' },
      { meal_id: 1, name: 'Feijão', quantity: 80, unit: 'g' },
    ]);
  });

  it('descarta ingrediente sem nome', async () => {
    getDbMock().setInsertResult(makeMeal());

    await createMeal({
      userId: 1,
      name: 'Almoço',
      time: '12:00',
      weekday: 0,
      ingredients: [{ name: '   ' }, { name: 'Arroz' }],
    });

    expect(getDbMock().getInsertValues()).toHaveLength(2);
  });
});

describe('updateMeal', () => {
  it('atualiza a refeição e substitui os ingredientes', async () => {
    await updateMeal({
      id: 1,
      name: ' Jantar ',
      time: '20:00',
      weekday: 4,
      ingredients: [{ name: 'Frango' }],
    });

    expect(getDbMock().mockDb.update).toHaveBeenCalled();
    expect(getDbMock().mockDb.delete).toHaveBeenCalled();
    expect(getDbMock().getInsertValues()).toEqual([{ meal_id: 1, name: 'Frango' }]);
  });

  it('valida os campos antes de gravar', async () => {
    await expect(
      updateMeal({ id: 1, name: '', time: '20:00', weekday: 4, ingredients: [] }),
    ).rejects.toThrow('Informe o nome da refeição');

    expect(getDbMock().mockDb.update).not.toHaveBeenCalled();
  });
});

describe('deleteMeal', () => {
  it('remove a refeição', async () => {
    await deleteMeal(1);

    expect(getDbMock().mockDb.delete).toHaveBeenCalled();
  });
});

describe('isValidTime', () => {
  it('aceita horário no formato HH:MM', () => {
    expect(isValidTime('00:00')).toBe(true);
    expect(isValidTime('12:30')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
  });

  it('rejeita horário inválido', () => {
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('12:60')).toBe(false);
    expect(isValidTime('8:00')).toBe(false);
    expect(isValidTime('12h00')).toBe(false);
    expect(isValidTime('')).toBe(false);
  });
});
