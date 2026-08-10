import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const workouts = sqliteTable('workouts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  created_at: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const exercises = sqliteTable('exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workout_id: integer('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  planned_sets: integer('planned_sets').notNull(),
  planned_reps: integer('planned_reps').notNull(),
});

export const workoutSchedules = sqliteTable('workout_schedules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workout_id: integer('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  weekday: integer('weekday').notNull(),
  time: text('time'),
}, (table) => ({
  workoutWeekdayUnique: uniqueIndex('workout_schedules_workout_id_weekday_unique').on(
    table.workout_id,
    table.weekday,
  ),
}));

export const exerciseLogs = sqliteTable('exercise_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workout_id: integer('workout_id').references(() => workouts.id, { onDelete: 'cascade' }),
  exercise_id: integer('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }),
  exercise_name: text('exercise_name'),
  date: text('date').notNull(),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  weight_used: real('weight_used'),
  actual_sets: integer('actual_sets'),
  actual_reps: text('actual_reps'),
  notes: text('notes'),
});

export const meals = sqliteTable('meals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  time: text('time').notNull(),
  weekday: integer('weekday').notNull(),
});

export const ingredients = sqliteTable('ingredients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  meal_id: integer('meal_id')
    .notNull()
    .references(() => meals.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  quantity: real('quantity'),
  unit: text('unit'),
});

export const mealLogs = sqliteTable('meal_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  meal_id: integer('meal_id')
    .notNull()
    .references(() => meals.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  status: text('status', { enum: ['eaten', 'not_eaten', 'partial'] }).notNull(),
  notes: text('notes'),
});

export const groceryItems = sqliteTable('grocery_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  planned_day: text('planned_day'),
  quantity: real('quantity'),
  purchased: integer('purchased', { mode: 'boolean' }).notNull().default(false),
  purchased_at: integer('purchased_at', { mode: 'timestamp_ms' }),
});

export const cookingItems = sqliteTable('cooking_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  what_to_cook: text('what_to_cook').notNull(),
  when_to_cook: text('when_to_cook').notNull(),
  lead_time_hours: integer('lead_time_hours'),
  meal_id: integer('meal_id').references(() => meals.id, { onDelete: 'set null' }),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  done_at: integer('done_at', { mode: 'timestamp_ms' }),
});

export const weighIns = sqliteTable('weigh_ins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  weight: real('weight').notNull(),
  measurements: text('measurements', { mode: 'json' }),
});

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  weigh_in_interval_days: integer('weigh_in_interval_days').notNull().default(7),
});
