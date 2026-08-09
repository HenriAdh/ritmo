import { and, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { exerciseLogs, exercises } from '@/src/db/schema';
import type { ExerciseLog } from '@/src/types';
import { parseRepSetValues } from '@/src/utils/reps';

export type ExerciseLogInput = {
  date: string;
  done: boolean;
  exerciseId?: number;
  workoutId?: number;
  exerciseName?: string;
  weightUsed?: number;
  actualSets?: number;
  actualReps?: string;
  notes?: string;
};

export type ExecutionItem = {
  key: string;
  isExtra: boolean;
  exerciseId: number | null;
  name: string;
  plannedSets: number | null;
  plannedReps: number | null;
  log: ExerciseLog | null;
};

export type WorkoutProgress = {
  total: number;
  done: number;
};

export async function listExercisesWithLogs(
  workoutId: number,
  date: string,
): Promise<ExecutionItem[]> {
  const exerciseRows = await db.select().from(exercises).where(eq(exercises.workout_id, workoutId));
  const exerciseIds = exerciseRows.map((exercise) => exercise.id);

  let logRows: ExerciseLog[] = [];
  if (exerciseIds.length > 0) {
    logRows = await db
      .select()
      .from(exerciseLogs)
      .where(and(eq(exerciseLogs.date, date), inArray(exerciseLogs.exercise_id, exerciseIds)));
  }

  const planned: ExecutionItem[] = exerciseRows.map((exercise) => ({
    key: `p-${exercise.id}`,
    isExtra: false,
    exerciseId: exercise.id,
    name: exercise.name,
    plannedSets: exercise.planned_sets,
    plannedReps: exercise.planned_reps,
    log: logRows.find((log) => log.exercise_id === exercise.id) ?? null,
  }));

  const extraRows = await db
    .select()
    .from(exerciseLogs)
    .where(
      and(
        eq(exerciseLogs.date, date),
        eq(exerciseLogs.workout_id, workoutId),
        isNull(exerciseLogs.exercise_id),
      ),
    );

  const extras: ExecutionItem[] = extraRows.map((log) => ({
    key: `x-${log.id}`,
    isExtra: true,
    exerciseId: null,
    name: log.exercise_name ?? 'Exercício extra',
    plannedSets: null,
    plannedReps: null,
    log,
  }));

  return [...planned, ...extras];
}

export async function upsertExerciseLog(input: ExerciseLogInput): Promise<void> {
  const exerciseId = input.exerciseId;
  const isExtra = exerciseId === undefined;

  const [existing] = isExtra
    ? await db
        .select()
        .from(exerciseLogs)
        .where(
          and(
            eq(exerciseLogs.date, input.date),
            eq(exerciseLogs.workout_id, input.workoutId ?? -1),
            eq(exerciseLogs.exercise_name, input.exerciseName ?? ''),
            isNull(exerciseLogs.exercise_id),
          ),
        )
        .limit(1)
    : await db
        .select()
        .from(exerciseLogs)
        .where(and(eq(exerciseLogs.exercise_id, exerciseId), eq(exerciseLogs.date, input.date)))
        .limit(1);

  const reps = input.actualReps ? parseRepSetValues(input.actualReps) : [];
  const derivedSets = reps.length > 0 ? reps.length : input.actualSets;

  const values = {
    done: input.done,
    ...(input.weightUsed !== undefined && { weight_used: input.weightUsed }),
    ...(derivedSets !== undefined && { actual_sets: derivedSets }),
    ...(input.actualReps !== undefined && { actual_reps: input.actualReps }),
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(isExtra && { workout_id: input.workoutId, exercise_name: input.exerciseName }),
  };

  if (existing) {
    db.update(exerciseLogs).set(values).where(eq(exerciseLogs.id, existing.id)).run();
  } else {
    db.insert(exerciseLogs)
      .values({
        ...(isExtra ? {} : { exercise_id: input.exerciseId }),
        date: input.date,
        ...values,
      })
      .run();
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