import type { Ingredient, Meal } from '@/src/types';
import { createMeal, deleteMeal, getMealDetail, listMeals, updateMeal } from '@/src/services/meals';

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

describe('listMeals', () => {
  it('retorna as refeições ordenadas por nome com a contagem de ingredientes', async () => {
    getDbMock().setSelectResults(
      [makeMeal({ id: 2, name: 'Jantar' }), makeMeal({ id: 1, name: 'Almoço' })],
      [makeIngredient({ id: 1, meal_id: 1 }), makeIngredient({ id: 2, meal_id: 1 })],
    );

    const result = await listMeals(1);

    expect(result.map((meal) => meal.name)).toEqual(['Almoço', 'Jantar']);
    expect(result[0]?.ingredientCount).toBe(2);
    expect(result[1]?.ingredientCount).toBe(0);
  });

  it('devolve lista vazia quando não há refeições', async () => {
    getDbMock().setSelectResults([], []);

    expect(await listMeals(1)).toEqual([]);
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
  it('valida o nome em branco', async () => {
    await expect(createMeal({ userId: 1, name: '   ', ingredients: [] })).rejects.toThrow(
      'Informe o nome da refeição',
    );
  });

  it('grava a refeição e os ingredientes em transação', async () => {
    getDbMock().setInsertResult(makeMeal({ name: 'Almoço' }));

    const result = await createMeal({
      userId: 1,
      name: '  Almoço  ',
      ingredients: [{ name: 'Arroz' }, { name: 'Feijão', quantity: 80, unit: 'g' }],
    });

    expect(getDbMock().mockDb.transaction).toHaveBeenCalled();
    expect(result.name).toBe('Almoço');
    expect(getDbMock().getInsertValues()[0]).toEqual({ user_id: 1, name: 'Almoço' });
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
      ingredients: [{ name: 'Frango' }],
    });

    expect(getDbMock().mockDb.update).toHaveBeenCalled();
    expect(getDbMock().mockDb.delete).toHaveBeenCalled();
    expect(getDbMock().getInsertValues()).toEqual([{ meal_id: 1, name: 'Frango' }]);
  });

  it('valida o nome antes de gravar', async () => {
    await expect(updateMeal({ id: 1, name: '', ingredients: [] })).rejects.toThrow(
      'Informe o nome da refeição',
    );

    expect(getDbMock().mockDb.update).not.toHaveBeenCalled();
  });
});

describe('deleteMeal', () => {
  it('remove a refeição', async () => {
    await deleteMeal(1);

    expect(getDbMock().mockDb.delete).toHaveBeenCalled();
  });
});
