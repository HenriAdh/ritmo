import { eq } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { ingredients, meals } from '@/src/db/schema';
import type { Ingredient, Meal } from '@/src/types';

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

export type CreateMealInput = {
  userId: number;
  name: string;
  ingredients: IngredientInput[];
};

export type UpdateMealInput = {
  id: number;
  name: string;
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

function insertIngredients(
  tx: Pick<typeof db, 'insert'>,
  mealId: number,
  list: IngredientInput[],
): void {
  for (const ingredient of list) {
    tx.insert(ingredients)
      .values({
        meal_id: mealId,
        name: ingredient.name,
        ...(ingredient.quantity !== undefined && { quantity: ingredient.quantity }),
        ...(ingredient.unit !== undefined && { unit: ingredient.unit }),
      })
      .run();
  }
}

export async function listMeals(userId: number): Promise<MealListItem[]> {
  const rows = await db.select().from(meals).where(eq(meals.user_id, userId));
  const allIngredients = await db.select().from(ingredients);

  const ingredientCount = new Map<number, number>();
  for (const ingredient of allIngredients) {
    ingredientCount.set(ingredient.meal_id, (ingredientCount.get(ingredient.meal_id) ?? 0) + 1);
  }

  return rows
    .map((meal) => ({ ...meal, ingredientCount: ingredientCount.get(meal.id) ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));
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
  if (!name) {
    throw new Error('Informe o nome da refeição');
  }

  const cleanIngredients = normalizeIngredients(input.ingredients);

  return db.transaction((tx) => {
    const meal = tx.insert(meals).values({ user_id: input.userId, name }).returning().get();
    insertIngredients(tx, meal.id, cleanIngredients);
    return meal;
  });
}

export async function updateMeal(input: UpdateMealInput): Promise<void> {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Informe o nome da refeição');
  }

  const cleanIngredients = normalizeIngredients(input.ingredients);

  db.transaction((tx) => {
    tx.update(meals).set({ name }).where(eq(meals.id, input.id)).run();
    tx.delete(ingredients).where(eq(ingredients.meal_id, input.id)).run();
    insertIngredients(tx, input.id, cleanIngredients);
  });
}

export async function deleteMeal(mealId: number): Promise<void> {
  await db.delete(meals).where(eq(meals.id, mealId));
}
