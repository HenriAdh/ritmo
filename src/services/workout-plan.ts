import { and, eq } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { workoutSchedules, workouts } from '@/src/db/schema';
import type { Workout } from '@/src/types';

export type WeekdayWorkouts = Partial<Record<number, Workout[]>>;

export const WEEKDAY_NAMES = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
];

export function weekdayName(weekday: number): string {
  return WEEKDAY_NAMES[weekday] ?? String(weekday);
}

export async function getWorkoutWeekdays(workoutId: number): Promise<number[]> {
  const rows = await db
    .select()
    .from(workoutSchedules)
    .where(eq(workoutSchedules.workout_id, workoutId));
  return rows.map((row) => row.weekday);
}

export async function setWorkoutWeekdays(
  workoutId: number,
  weekdays: number[],
): Promise<void> {
  const unique = [...new Set(weekdays)];

  db.transaction((tx) => {
    tx.delete(workoutSchedules).where(eq(workoutSchedules.workout_id, workoutId)).run();

    for (const weekday of unique) {
      tx.insert(workoutSchedules).values({ workout_id: workoutId, weekday }).run();
    }
  });
}

export async function listWeekdayWorkouts(userId: number): Promise<WeekdayWorkouts> {
  const workoutRows = await db.select().from(workouts).where(eq(workouts.user_id, userId));
  const scheduleRows = await db.select().from(workoutSchedules);

  const result: WeekdayWorkouts = {};
  const workoutById = new Map(workoutRows.map((workout) => [workout.id, workout]));

  for (const schedule of scheduleRows) {
    const workout = workoutById.get(schedule.workout_id);
    if (!workout) {
      continue;
    }
    const list = result[schedule.weekday];
    if (list) {
      list.push(workout);
    } else {
      result[schedule.weekday] = [workout];
    }
  }

  return result;
}

export async function listWorkoutsWithWeekdays(
  userId: number,
): Promise<{ workout: Workout; weekdays: number[] }[]> {
  const workoutRows = await db.select().from(workouts).where(eq(workouts.user_id, userId));
  const scheduleRows = await db.select().from(workoutSchedules);

  const daysByWorkout = new Map<number, number[]>();
  for (const schedule of scheduleRows) {
    const days = daysByWorkout.get(schedule.workout_id);
    if (days) {
      days.push(schedule.weekday);
    } else {
      daysByWorkout.set(schedule.workout_id, [schedule.weekday]);
    }
  }

  return workoutRows.map((workout) => ({
    workout,
    weekdays: daysByWorkout.get(workout.id) ?? [],
  }));
}

export async function removeWorkoutFromWeekday(
  workoutId: number,
  weekday: number,
): Promise<void> {
  await db
    .delete(workoutSchedules)
    .where(and(eq(workoutSchedules.workout_id, workoutId), eq(workoutSchedules.weekday, weekday)));
}