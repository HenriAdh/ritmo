import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { exerciseLogs, exercises } from '@/src/db/schema';
import type { Exercise, ExerciseLog } from '@/src/types';

export type ExerciseLogInput = {
  exerciseId: number;
  date: string;
  done: boolean;
  weightUsed?: number;
  actualSets?: number;
  actualReps?: number;
  notes?: string;
};

export type ExerciseWithLog = {
  exercise: Exercise;
  log: ExerciseLog | null;
};

export type WorkoutProgress = {
  total: number;
  done: number;
};

export async function listExercisesWithLogs(
  workoutId: number,
  date: string,
): Promise<ExerciseWithLog[]> {
  const exerciseRows = await db.select().from(exercises).where(eq(exercises.workout_id, workoutId));
  if (exerciseRows.length === 0) {
    return [];
  }

  const exerciseIds = exerciseRows.map((exercise) => exercise.id);
  const logRows = await db
    .select()
    .from(exerciseLogs)
    .where(and(eq(exerciseLogs.date, date), inArray(exerciseLogs.exercise_id, exerciseIds)));

  return exerciseRows.map((exercise) => ({
    exercise,
    log: logRows.find((log) => log.exercise_id === exercise.id) ?? null,
  }));
}

export async function upsertExerciseLog(input: ExerciseLogInput): Promise<void> {
  const [existing] = await db
    .select()
    .from(exerciseLogs)
    .where(and(eq(exerciseLogs.exercise_id, input.exerciseId), eq(exerciseLogs.date, input.date)))
    .limit(1);

  const values = {
    done: input.done,
    ...(input.weightUsed !== undefined && { weight_used: input.weightUsed }),
    ...(input.actualSets !== undefined && { actual_sets: input.actualSets }),
    ...(input.actualReps !== undefined && { actual_reps: input.actualReps }),
    ...(input.notes !== undefined && { notes: input.notes }),
  };

  if (existing) {
    db.update(exerciseLogs).set(values).where(eq(exerciseLogs.id, existing.id)).run();
  } else {
    db.insert(exerciseLogs).values({ exercise_id: input.exerciseId, date: input.date, ...values }).run();
  }
}

export async function getWorkoutProgress(
  workoutId: number,
  date: string,
): Promise<WorkoutProgress> {
  const exerciseRows = await db.select().from(exercises).where(eq(exercises.workout_id, workoutId));
  if (exerciseRows.length === 0) {
    return { total: 0, done: 0 };
  }

  const exerciseIds = exerciseRows.map((exercise) => exercise.id);
  const logRows = await db
    .select()
    .from(exerciseLogs)
    .where(and(eq(exerciseLogs.date, date), inArray(exerciseLogs.exercise_id, exerciseIds)));

  const done = logRows.filter((log) => log.done).length;
  return { total: exerciseRows.length, done };
}