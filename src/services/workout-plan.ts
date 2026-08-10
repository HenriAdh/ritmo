import { and, eq } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { workoutSchedules, workouts } from '@/src/db/schema';
import type { Workout } from '@/src/types';

export type ScheduledDay = {
  weekday: number;
  time: string | null;
};

export type WeekdayWorkouts = Partial<
  Record<number, { workout: Workout; time: string | null }[]>
>;

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

export async function getWorkoutWeekdays(workoutId: number): Promise<ScheduledDay[]> {
  const rows = await db
    .select()
    .from(workoutSchedules)
    .where(eq(workoutSchedules.workout_id, workoutId));
  return rows.map((row) => ({ weekday: row.weekday, time: row.time }));
}

export async function setWorkoutWeekdays(
  workoutId: number,
  weekdays: ScheduledDay[],
): Promise<void> {
  const unique = new Map<number, string | null>();
  for (const day of weekdays) {
    unique.set(day.weekday, day.time ?? null);
  }

  db.transaction((tx) => {
    tx.delete(workoutSchedules).where(eq(workoutSchedules.workout_id, workoutId)).run();

    for (const [weekday, time] of unique) {
      tx.insert(workoutSchedules).values({ workout_id: workoutId, weekday, time }).run();
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
      list.push({ workout, time: schedule.time });
    } else {
      result[schedule.weekday] = [{ workout, time: schedule.time }];
    }
  }

  return result;
}

export type WorkoutWithSchedule = {
  workout: Workout;
  weekdays: ScheduledDay[];
};

export async function listWorkoutsWithWeekdays(
  userId: number,
): Promise<WorkoutWithSchedule[]> {
  const workoutRows = await db.select().from(workouts).where(eq(workouts.user_id, userId));
  const scheduleRows = await db.select().from(workoutSchedules);

  const daysByWorkout = new Map<number, ScheduledDay[]>();
  for (const schedule of scheduleRows) {
    const days = daysByWorkout.get(schedule.workout_id);
    const day = { weekday: schedule.weekday, time: schedule.time };
    if (days) {
      days.push(day);
    } else {
      daysByWorkout.set(schedule.workout_id, [day]);
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