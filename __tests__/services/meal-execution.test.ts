import type { Ingredient, MealLog, MealLogItem } from '@/src/types';
import {
  listMealExecution,
  resolveMealStatus,
  upsertMealLog,
} from '@/src/services/meal-execution';

jest.mock('@/src/db/client');

type DbMock = typeof import('@/src/db/__mocks__/client');

function getDbMock(): DbMock {
  return jest.requireMock<DbMock>('@/src/db/client');
}

const DATE = '2026-08-09';

const rice: Ingredient = { id: 1, meal_id: 1, name: 'Arroz', quantity: 100, unit: 'g' };
const chicken: Ingredient = { id: 2, meal_id: 1, name: 'Frango', quantity: 150, unit: 'g' };
const salt: Ingredient = { id: 3, meal_id: 1, name: 'Sal', quantity: null, unit: null };

const eatenLog: MealLog = {
  id: 5,
  meal_id: 1,
  date: DATE,
  status: 'partial',
  notes: 'Comi só metade',
};

const riceLogItem: MealLogItem = {
  id: 50,
  meal_log_id: 5,
  ingredient_id: 1,
  name: null,
  quantity: 50,
};

const extraLogItem: MealLogItem = {
  id: 51,
  meal_log_id: 5,
  ingredient_id: null,
  name: 'Vitamina',
  quantity: 200,
};

beforeEach(() => {
  getDbMock().resetDb();
});

describe('resolveMealStatus', () => {
  it('devolve not_eaten quando a refeição não foi marcada', () => {
    expect(
      resolveMealStatus(false, [{ plannedQuantity: 100, eatenQuantity: 100 }]),
    ).toBe('not_eaten');
  });

  it('devolve eaten quando todas as quantidades batem com o planejado', () => {
    expect(
      resolveMealStatus(true, [
        { plannedQuantity: 100, eatenQuantity: 100 },
        { plannedQuantity: 150, eatenQuantity: 150 },
      ]),
    ).toBe('eaten');
  });

  it('devolve eaten quando nenhuma quantidade foi informada', () => {
    expect(resolveMealStatus(true, [{ plannedQuantity: 100, eatenQuantity: null }])).toBe('eaten');
  });

  it('devolve eaten quando o ingrediente não tem quantidade planejada', () => {
    expect(resolveMealStatus(true, [{ plannedQuantity: null, eatenQuantity: 5 }])).toBe('eaten');
  });

  it('devolve partial quando alguma quantidade difere do planejado', () => {
    expect(
      resolveMealStatus(true, [
        { plannedQuantity: 100, eatenQuantity: 100 },
        { plannedQuantity: 150, eatenQuantity: 60 },
      ]),
    ).toBe('partial');
  });
});

describe('listMealExecution', () => {
  it('cruza os ingredientes da refeição com o que foi registrado no dia', async () => {
    getDbMock().setSelectResults([eatenLog], [rice, chicken, salt], [riceLogItem, extraLogItem]);

    const result = await listMealExecution(1, DATE);

    expect(result).toEqual({
      log: eatenLog,
      items: [
        {
          key: 'i-1',
          ingredientId: 1,
          name: 'Arroz',
          plannedQuantity: 100,
          unit: 'g',
          eatenQuantity: 50,
        },
        {
          key: 'i-2',
          ingredientId: 2,
          name: 'Frango',
          plannedQuantity: 150,
          unit: 'g',
          eatenQuantity: null,
        },
        {
          key: 'i-3',
          ingredientId: 3,
          name: 'Sal',
          plannedQuantity: null,
          unit: null,
          eatenQuantity: null,
        },
      ],
      extras: [{ key: 'x-51', name: 'Vitamina', quantity: 200 }],
    });
  });

  it('devolve log null e quantidades vazias quando a refeição ainda não foi registrada', async () => {
    getDbMock().setSelectResults([], [rice]);

    const result = await listMealExecution(1, DATE);

    expect(result.log).toBeNull();
    expect(result.items).toEqual([
      {
        key: 'i-1',
        ingredientId: 1,
        name: 'Arroz',
        plannedQuantity: 100,
        unit: 'g',
        eatenQuantity: null,
      },
    ]);
    expect(result.extras).toEqual([]);
  });

  it('devolve lista de ingredientes vazia quando a refeição não tem ingrediente', async () => {
    getDbMock().setSelectResults([], []);

    const result = await listMealExecution(1, DATE);

    expect(result).toEqual({ log: null, items: [], extras: [] });
  });
});

describe('upsertMealLog', () => {
  it('atualiza o log existente e regrava as quantidades dos ingredientes', async () => {
    getDbMock().setSelectResults([eatenLog], [rice, chicken]);

    await upsertMealLog({
      mealId: 1,
      date: DATE,
      done: true,
      notes: 'Foi tudo',
      items: [
        { ingredientId: 1, quantity: 100 },
        { ingredientId: 2, quantity: 60 },
      ],
    });

    expect(getDbMock().mockDb.update).toHaveBeenCalled();
    expect(getDbMock().getInsertValues()).toEqual([
      { meal_log_id: 5, ingredient_id: 1, quantity: 100 },
      { meal_log_id: 5, ingredient_id: 2, quantity: 60 },
    ]);
  });

  it('insere um novo log com status partial quando falta quantidade', async () => {
    getDbMock().setSelectResults([], [rice, chicken]);
    getDbMock().setInsertResult({ id: 9 });

    await upsertMealLog({
      mealId: 1,
      date: DATE,
      done: true,
      items: [{ ingredientId: 2, quantity: 60 }],
    });

    expect(getDbMock().getInsertValues()).toContainEqual({
      meal_id: 1,
      date: DATE,
      status: 'partial',
    });
  });

  it('grava status not_eaten quando a refeição não foi marcada', async () => {
    getDbMock().setSelectResults([], [rice]);
    getDbMock().setInsertResult({ id: 9 });

    await upsertMealLog({ mealId: 1, date: DATE, done: false, items: [] });

    expect(getDbMock().getInsertValues()).toContainEqual({
      meal_id: 1,
      date: DATE,
      status: 'not_eaten',
    });
  });

  it('ignora ingrediente sem quantidade informada', async () => {
    getDbMock().setSelectResults([], [rice]);
    getDbMock().setInsertResult({ id: 9 });

    await upsertMealLog({
      mealId: 1,
      date: DATE,
      done: true,
      items: [{ ingredientId: 1, quantity: null }, { ingredientId: 1 }],
    });

    expect(getDbMock().getInsertValues()).toEqual([
      { meal_id: 1, date: DATE, status: 'eaten' },
    ]);
  });

  it('grava os extras com nome e sem vínculo com ingrediente', async () => {
    getDbMock().setSelectResults([], [rice]);
    getDbMock().setInsertResult({ id: 9 });

    await upsertMealLog({
      mealId: 1,
      date: DATE,
      done: true,
      items: [{ ingredientId: 1, quantity: 100 }],
      extras: [{ name: '  Vitamina  ', quantity: 200 }, { name: 'Água' }],
    });

    expect(getDbMock().getInsertValues()).toEqual([
      { meal_id: 1, date: DATE, status: 'eaten' },
      { meal_log_id: 9, ingredient_id: 1, quantity: 100 },
      { meal_log_id: 9, ingredient_id: null, name: 'Vitamina', quantity: 200 },
      { meal_log_id: 9, ingredient_id: null, name: 'Água', quantity: null },
    ]);
  });

  it('ignora extra sem nome e não deixa o extra afetar o status', async () => {
    getDbMock().setSelectResults([], [rice]);
    getDbMock().setInsertResult({ id: 9 });

    await upsertMealLog({
      mealId: 1,
      date: DATE,
      done: true,
      items: [{ ingredientId: 1, quantity: 100 }],
      extras: [{ name: '   ', quantity: 50 }],
    });

    const values = getDbMock().getInsertValues();
    expect(values).toContainEqual({ meal_id: 1, date: DATE, status: 'eaten' });
    expect(values).toHaveLength(2);
  });
});
