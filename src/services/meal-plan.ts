import { eq } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { mealSchedules, meals } from '@/src/db/schema';
import type { Meal } from '@/src/types';

export type ScheduledDay = {
  weekday: number;
  time: string | null;
};

export type WeekdayMeals = Partial<Record<number, { meal: Meal; time: string | null }[]>>;

export async function getMealWeekdays(mealId: number): Promise<ScheduledDay[]> {
  const rows = await db.select().from(mealSchedules).where(eq(mealSchedules.meal_id, mealId));
  return rows.map((row) => ({ weekday: row.weekday, time: row.time }));
}

export async function setMealWeekdays(mealId: number, weekdays: ScheduledDay[]): Promise<void> {
  const unique = new Map<number, string | null>();
  for (const day of weekdays) {
    unique.set(day.weekday, day.time ?? null);
  }

  db.transaction((tx) => {
    tx.delete(mealSchedules).where(eq(mealSchedules.meal_id, mealId)).run();

    for (const [weekday, time] of unique) {
      tx.insert(mealSchedules).values({ meal_id: mealId, weekday, time }).run();
    }
  });
}

export async function listWeekdayMeals(userId: number): Promise<WeekdayMeals> {
  const mealRows = await db.select().from(meals).where(eq(meals.user_id, userId));
  const scheduleRows = await db.select().from(mealSchedules);

  const result: WeekdayMeals = {};
  const mealById = new Map(mealRows.map((meal) => [meal.id, meal]));

  for (const schedule of scheduleRows) {
    const meal = mealById.get(schedule.meal_id);
    if (!meal) {
      continue;
    }
    const list = result[schedule.weekday];
    if (list) {
      list.push({ meal, time: schedule.time });
    } else {
      result[schedule.weekday] = [{ meal, time: schedule.time }];
    }
  }

  return result;
}

export type MealWithWeekdays = {
  meal: Meal;
  weekdays: ScheduledDay[];
};

export async function listMealsWithWeekdays(userId: number): Promise<MealWithWeekdays[]> {
  const mealRows = await db.select().from(meals).where(eq(meals.user_id, userId));
  const scheduleRows = await db.select().from(mealSchedules);

  const daysByMeal = new Map<number, ScheduledDay[]>();
  for (const schedule of scheduleRows) {
    const days = daysByMeal.get(schedule.meal_id);
    const day = { weekday: schedule.weekday, time: schedule.time };
    if (days) {
      days.push(day);
    } else {
      daysByMeal.set(schedule.meal_id, [day]);
    }
  }

  return mealRows.map((meal) => ({
    meal,
    weekdays: daysByMeal.get(meal.id) ?? [],
  }));
}
