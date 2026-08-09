import type { InferSelectModel } from 'drizzle-orm';

import type {
  cookingItems,
  exerciseLogs,
  exercises,
  groceryItems,
  ingredients,
  mealLogs,
  meals,
  settings,
  users,
  weighIns,
  workoutSchedules,
  workouts,
} from '@/src/db/schema';

export type User = InferSelectModel<typeof users>;
export type Workout = InferSelectModel<typeof workouts>;
export type Exercise = InferSelectModel<typeof exercises>;
export type ExerciseLog = InferSelectModel<typeof exerciseLogs>;
export type WorkoutSchedule = InferSelectModel<typeof workoutSchedules>;
export type Meal = InferSelectModel<typeof meals>;
export type Ingredient = InferSelectModel<typeof ingredients>;
export type MealLog = InferSelectModel<typeof mealLogs>;
export type GroceryItem = InferSelectModel<typeof groceryItems>;
export type CookingItem = InferSelectModel<typeof cookingItems>;
export type WeighIn = InferSelectModel<typeof weighIns>;
export type Setting = InferSelectModel<typeof settings>;
