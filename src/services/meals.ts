import { eq } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { ingredients, meals } from '@/src/db/schema';
import type { Ingredient, Meal } from '@/src/types';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export type IngredientInput = {
  name: string;
  quantity?: number;
  unit?: string;
};

export type MealListItem = Meal & { ingredientCount: number };

export type MealDetail = {
  meal: Meal;
  ingredients: Ingredient[];
};

export type WeekdayMeals = Partial<Record<number, MealListItem[]>>;

export type CreateMealInput = {
  userId: number;
  name: string;
  time: string;
  weekday: number;
  ingredients: IngredientInput[];
};

export type UpdateMealInput = {
  id: number;
  name: string;
  time: string;
  weekday: number;
  ingredients: IngredientInput[];
};

function normalizeIngredients(list: IngredientInput[]): IngredientInput[] {
  return list
    .filter((ingredient) => ingredient.name.trim().length > 0)
    .map((ingredient) => ({
      name: ingredient.name.trim(),
      ...(ingredient.quantity !== undefined && { quantity: ingredient.quantity }),
      ...(ingredient.unit !== undefined && { unit: ingredient.unit }),
    }));
}

function validateFields(name: string, time: string, weekday: number): void {
  if (name.trim().length === 0) {
    throw new Error('Informe o nome da refeição');
  }
  if (!isValidTime(time)) {
    throw new Error('Informe um horário válido no formato HH:MM');
  }
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    throw new Error('Selecione o dia da semana');
  }
}

function compareMeals(a: Meal, b: Meal): number {
  if (a.time !== b.time) {
    return a.time.localeCompare(b.time);
  }
  return a.name.localeCompare(b.name);
}

export async function listMealsByWeekday(userId: number): Promise<WeekdayMeals> {
  const mealRows = await db.select().from(meals).where(eq(meals.user_id, userId));
  const allIngredients = await db.select().from(ingredients);

  const ingredientCount = new Map<number, number>();
  for (const ingredient of allIngredients) {
    ingredientCount.set(ingredient.meal_id, (ingredientCount.get(ingredient.meal_id) ?? 0) + 1);
  }

  const result: WeekdayMeals = {};
  for (const meal of mealRows) {
    const item: MealListItem = { ...meal, ingredientCount: ingredientCount.get(meal.id) ?? 0 };
    const list = result[meal.weekday];
    if (list) {
      list.push(item);
    } else {
      result[meal.weekday] = [item];
    }
  }

  for (const list of Object.values(result)) {
    list?.sort(compareMeals);
  }

  return result;
}

export async function getMealDetail(mealId: number): Promise<MealDetail> {
  const [meal] = await db.select().from(meals).where(eq(meals.id, mealId)).limit(1);
  if (!meal) {
    throw new Error('Refeição não encontrada');
  }

  const ingredientRows = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.meal_id, mealId));
  return { meal, ingredients: ingredientRows };
}

export async function createMeal(input: CreateMealInput): Promise<Meal> {
  const name = input.name.trim();
  validateFields(name, input.time, input.weekday);
  const cleanIngredients = normalizeIngredients(input.ingredients);

  return db.transaction((tx) => {
    const meal = tx
      .insert(meals)
      .values({
        user_id: input.userId,
        name,
        time: input.time,
        weekday: input.weekday,
      })
      .returning()
      .get();

    for (const ingredient of cleanIngredients) {
      tx.insert(ingredients)
        .values({
          meal_id: meal.id,
          name: ingredient.name,
          ...(ingredient.quantity !== undefined && { quantity: ingredient.quantity }),
          ...(ingredient.unit !== undefined && { unit: ingredient.unit }),
        })
        .run();
    }

    return meal;
  });
}

export async function updateMeal(input: UpdateMealInput): Promise<void> {
  const name = input.name.trim();
  validateFields(name, input.time, input.weekday);
  const cleanIngredients = normalizeIngredients(input.ingredients);

  db.transaction((tx) => {
    tx.update(meals)
      .set({ name, time: input.time, weekday: input.weekday })
      .where(eq(meals.id, input.id))
      .run();

    tx.delete(ingredients).where(eq(ingredients.meal_id, input.id)).run();

    for (const ingredient of cleanIngredients) {
      tx.insert(ingredients)
        .values({
          meal_id: input.id,
          name: ingredient.name,
          ...(ingredient.quantity !== undefined && { quantity: ingredient.quantity }),
          ...(ingredient.unit !== undefined && { unit: ingredient.unit }),
        })
        .run();
    }
  });
}

export async function deleteMeal(mealId: number): Promise<void> {
  await db.delete(meals).where(eq(meals.id, mealId));
}
