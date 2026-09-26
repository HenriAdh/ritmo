import type { Meal } from '@/src/types';
import {
  getMealWeekdays,
  listMealsWithWeekdays,
  listWeekdayMeals,
  setMealWeekdays,
} from '@/src/services/meal-plan';

jest.mock('@/src/db/client');

type DbMock = typeof import('@/src/db/__mocks__/client');

function getDbMock(): DbMock {
  return jest.requireMock<DbMock>('@/src/db/client');
}

const mealA: Meal = { id: 1, user_id: 1, name: 'Almoço' };
const mealB: Meal = { id: 2, user_id: 1, name: 'Jantar' };

beforeEach(() => {
  getDbMock().resetDb();
});

describe('getMealWeekdays', () => {
  it('retorna os dias e horários vinculados à refeição', async () => {
    getDbMock().setSelectResults([
      { id: 1, meal_id: 1, weekday: 0, time: '12:00' },
      { id: 2, meal_id: 1, weekday: 4, time: null },
    ]);

    const result = await getMealWeekdays(1);

    expect(result).toEqual([
      { weekday: 0, time: '12:00' },
      { weekday: 4, time: null },
    ]);
  });
});

describe('setMealWeekdays', () => {
  it('substitui os dias e remove duplicados em transação', async () => {
    await setMealWeekdays(1, [
      { weekday: 2, time: '12:00' },
      { weekday: 2, time: '13:00' },
      { weekday: 5, time: null },
    ]);

    expect(getDbMock().mockDb.transaction).toHaveBeenCalled();
    expect(getDbMock().mockDb.delete).toHaveBeenCalled();
    expect(getDbMock().getInsertValues()).toEqual([
      { meal_id: 1, weekday: 2, time: '13:00' },
      { meal_id: 1, weekday: 5, time: null },
    ]);
  });

  it('apaga todos os vínculos quando a lista vem vazia', async () => {
    await setMealWeekdays(1, []);

    expect(getDbMock().mockDb.delete).toHaveBeenCalled();
    expect(getDbMock().getInsertValues()).toHaveLength(0);
  });
});

describe('listWeekdayMeals', () => {
  it('agrupa refeições por dia da semana com horário', async () => {
    getDbMock().setSelectResults([mealA, mealB], [
      { id: 1, meal_id: 1, weekday: 0, time: '12:00' },
      { id: 2, meal_id: 1, weekday: 4, time: null },
      { id: 3, meal_id: 2, weekday: 4, time: '20:00' },
    ]);

    const result = await listWeekdayMeals(1);

    expect(result[0]).toEqual([{ meal: mealA, time: '12:00' }]);
    expect(result[4]).toEqual([
      { meal: mealA, time: null },
      { meal: mealB, time: '20:00' },
    ]);
    expect(result[1]).toBeUndefined();
  });

  it('ignora vínculo cujo meal não pertence ao usuário', async () => {
    getDbMock().setSelectResults([mealA], [{ id: 1, meal_id: 99, weekday: 0, time: '12:00' }]);

    expect(await listWeekdayMeals(1)).toEqual({});
  });
});

describe('listMealsWithWeekdays', () => {
  it('retorna cada refeição com seus dias e horários', async () => {
    getDbMock().setSelectResults([mealA, mealB], [
      { id: 1, meal_id: 1, weekday: 0, time: '12:00' },
      { id: 2, meal_id: 1, weekday: 4, time: null },
    ]);

    const result = await listMealsWithWeekdays(1);

    expect(result).toEqual([
      {
        meal: mealA,
        weekdays: [
          { weekday: 0, time: '12:00' },
          { weekday: 4, time: null },
        ],
      },
      { meal: mealB, weekdays: [] },
    ]);
  });
});
