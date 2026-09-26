import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { exercises, exerciseLogs, mealLogs } from '@/src/db/schema';
import { listWeekdayMeals } from '@/src/services/meal-plan';
import type { MealLogStatus } from '@/src/services/meal-execution';
import { listWeekdayWorkouts } from '@/src/services/workout-plan';
import { buildDayAgenda } from '@/src/utils/day-agenda';
import {
  applyCompletion,
  pickNextActivity,
  summarizeDay,
  type DayItemStatus,
  type DaySummary,
} from '@/src/utils/day-summary';

const MEAL_STATUS_TO_DAY_STATUS: Record<MealLogStatus, DayItemStatus> = {
  eaten: 'done',
  partial: 'partial',
  not_eaten: 'skipped',
};

export async function getDaySummary(
  userId: number,
  date: string,
  weekday: number,
): Promise<DaySummary> {
  const workoutWeekdays = await listWeekdayWorkouts(userId);
  const mealWeekdays = await listWeekdayMeals(userId);

  const workoutEntries = workoutWeekdays[weekday] ?? [];
  const mealEntries = mealWeekdays[weekday] ?? [];

  const agenda = buildDayAgenda(workoutEntries, mealEntries);
  const completion: Record<string, DayItemStatus> = {};

  const mealLogRows = await db.select().from(mealLogs).where(eq(mealLogs.date, date));
  const statusByMealId = new Map<number, MealLogStatus>();
  for (const row of mealLogRows) {
    statusByMealId.set(row.meal_id, row.status);
  }

  for (const { meal } of mealEntries) {
    const status = statusByMealId.get(meal.id);
    completion[`meal-${meal.id}`] = status ? MEAL_STATUS_TO_DAY_STATUS[status] : 'pending';
  }

  const workoutIds = workoutEntries.map((entry) => entry.workout.id);

  // inArray com lista vazia gera SQL inválido, então pula a query.
  const exerciseRows =
    workoutIds.length > 0
      ? await db.select().from(exercises).where(inArray(exercises.workout_id, workoutIds))
      : [];

  const exerciseIds = exerciseRows.map((exercise) => exercise.id);
  const logRows =
    exerciseIds.length > 0
      ? await db
          .select()
          .from(exerciseLogs)
          .where(
            and(
              eq(exerciseLogs.date, date),
              inArray(exerciseLogs.exercise_id, exerciseIds),
            ),
          )
      : [];

  const workoutIdByExercise = new Map(
    exerciseRows.map((exercise) => [exercise.id, exercise.workout_id]),
  );
  const totalByWorkout = new Map<number, number>();
  const doneByWorkout = new Map<number, number>();

  for (const exercise of exerciseRows) {
    totalByWorkout.set(exercise.workout_id, (totalByWorkout.get(exercise.workout_id) ?? 0) + 1);
  }
  for (const log of logRows) {
    if (!log.done || log.exercise_id === null) {
      continue;
    }
    const workoutId = workoutIdByExercise.get(log.exercise_id);
    if (workoutId === undefined) {
      continue;
    }
    doneByWorkout.set(workoutId, (doneByWorkout.get(workoutId) ?? 0) + 1);
  }

  for (const { workout } of workoutEntries) {
    const total = totalByWorkout.get(workout.id) ?? 0;
    const done = doneByWorkout.get(workout.id) ?? 0;
    // Treino sem exercício não tem como ser confirmado, então segue pendente.
    completion[`workout-${workout.id}`] =
      total === 0 ? 'pending' : done >= total ? 'done' : done > 0 ? 'partial' : 'pending';
  }

  const items = applyCompletion(agenda, completion);
  return { items, next: pickNextActivity(items), ...summarizeDay(items) };
}

export type { DaySummary };
