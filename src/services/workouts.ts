import { eq } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { exercises, workouts } from '@/src/db/schema';
import type { Exercise, Workout } from '@/src/types';

export type ExerciseInput = {
  name: string;
  plannedSets: number;
  plannedReps: number;
};

export type WorkoutListItem = Workout & { exerciseCount: number };

export type WorkoutDetail = {
  workout: Workout;
  exercises: Exercise[];
};

export type CreateWorkoutInput = {
  userId: number;
  title: string;
  exercises: ExerciseInput[];
};

export type UpdateWorkoutInput = {
  id: number;
  title: string;
  exercises: ExerciseInput[];
};

function normalizeExercises(list: ExerciseInput[]) {
  return list.filter((exercise) => exercise.name.trim().length > 0);
}

export async function listWorkouts(userId: number): Promise<WorkoutListItem[]> {
  const rows = await db.select().from(workouts).where(eq(workouts.user_id, userId));
  const allExercises = await db.select().from(exercises);

  const exerciseCount = new Map<number, number>();
  for (const exercise of allExercises) {
    exerciseCount.set(exercise.workout_id, (exerciseCount.get(exercise.workout_id) ?? 0) + 1);
  }

  return rows.map((workout) => ({ ...workout, exerciseCount: exerciseCount.get(workout.id) ?? 0 }));
}

export async function getWorkoutDetail(workoutId: number): Promise<WorkoutDetail> {
  const [workout] = await db.select().from(workouts).where(eq(workouts.id, workoutId)).limit(1);
  if (!workout) {
    throw new Error('Treino não encontrado');
  }

  const exerciseRows = await db.select().from(exercises).where(eq(exercises.workout_id, workoutId));
  return { workout, exercises: exerciseRows };
}

export async function createWorkout(input: CreateWorkoutInput): Promise<Workout> {
  const title = input.title.trim();
  if (!title) {
    throw new Error('Informe o nome do treino');
  }

  const cleanExercises = normalizeExercises(input.exercises);

  return db.transaction((tx) => {
    const workout = tx.insert(workouts).values({ user_id: input.userId, title }).returning().get();

    for (const exercise of cleanExercises) {
      tx.insert(exercises).values({
        workout_id: workout.id,
        name: exercise.name.trim(),
        planned_sets: exercise.plannedSets,
        planned_reps: exercise.plannedReps,
      }).run();
    }

    return workout;
  });
}

export async function updateWorkout(input: UpdateWorkoutInput): Promise<void> {
  const title = input.title.trim();
  if (!title) {
    throw new Error('Informe o nome do treino');
  }

  const cleanExercises = normalizeExercises(input.exercises);

  db.transaction((tx) => {
    tx.update(workouts).set({ title }).where(eq(workouts.id, input.id)).run();
    tx.delete(exercises).where(eq(exercises.workout_id, input.id)).run();

    for (const exercise of cleanExercises) {
      tx.insert(exercises).values({
        workout_id: input.id,
        name: exercise.name.trim(),
        planned_sets: exercise.plannedSets,
        planned_reps: exercise.plannedReps,
      }).run();
    }
  });
}

export async function deleteWorkout(workoutId: number): Promise<void> {
  await db.delete(workouts).where(eq(workouts.id, workoutId));
}