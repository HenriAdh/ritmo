import { and, eq } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { ingredients, mealLogItems, mealLogs } from '@/src/db/schema';
import type { Ingredient, MealLog, MealLogItem } from '@/src/types';

export type MealLogStatus = 'eaten' | 'not_eaten' | 'partial';

export const MEAL_STATUS_LABELS: Record<MealLogStatus, string> = {
  eaten: 'Comi tudo',
  not_eaten: 'Não comi',
  partial: 'Comi parcialmente',
};

export type MealIngredientRow = {
  key: string;
  ingredientId: number;
  name: string;
  plannedQuantity: number | null;
  unit: string | null;
  eatenQuantity: number | null;
};

export type MealExtraRow = {
  key: string;
  name: string;
  quantity: number | null;
};

export type MealExecution = {
  log: MealLog | null;
  items: MealIngredientRow[];
  extras: MealExtraRow[];
};

export type MealIngredientInput = {
  ingredientId: number;
  quantity?: number | null;
};

export type MealExtraInput = {
  name: string;
  quantity?: number | null;
};

export type MealLogInput = {
  mealId: number;
  date: string;
  done: boolean;
  notes?: string;
  items: MealIngredientInput[];
  extras?: MealExtraInput[];
};

export type MealQuantity = {
  plannedQuantity: number | null;
  eatenQuantity: number | null;
};

const QUANTITY_TOLERANCE = 1e-9;

function isPartialQuantity(item: MealQuantity): boolean {
  if (item.plannedQuantity === null || item.eatenQuantity === null) {
    return false;
  }
  return Math.abs(item.plannedQuantity - item.eatenQuantity) > QUANTITY_TOLERANCE;
}

export function resolveMealStatus(done: boolean, items: MealQuantity[]): MealLogStatus {
  if (!done) {
    return 'not_eaten';
  }
  return items.some(isPartialQuantity) ? 'partial' : 'eaten';
}

export async function listMealExecution(mealId: number, date: string): Promise<MealExecution> {
  const [log] = await db
    .select()
    .from(mealLogs)
    .where(and(eq(mealLogs.meal_id, mealId), eq(mealLogs.date, date)))
    .limit(1);

  const ingredientRows = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.meal_id, mealId));

  const logItemRows: MealLogItem[] = log
    ? await db.select().from(mealLogItems).where(eq(mealLogItems.meal_log_id, log.id))
    : [];

  return {
    log: log ?? null,
    items: ingredientRows.map((ingredient: Ingredient) => ({
      key: `i-${ingredient.id}`,
      ingredientId: ingredient.id,
      name: ingredient.name,
      plannedQuantity: ingredient.quantity,
      unit: ingredient.unit,
      eatenQuantity:
        logItemRows.find((row) => row.ingredient_id === ingredient.id)?.quantity ?? null,
    })),
    extras: logItemRows
      .filter((row) => row.ingredient_id === null && row.name !== null)
      .map((row) => ({
        key: `x-${row.id}`,
        name: row.name as string,
        quantity: row.quantity,
      })),
  };
}

export async function upsertMealLog(input: MealLogInput): Promise<void> {
  const [existing] = await db
    .select()
    .from(mealLogs)
    .where(and(eq(mealLogs.meal_id, input.mealId), eq(mealLogs.date, input.date)))
    .limit(1);

  const ingredientRows = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.meal_id, input.mealId));
  const plannedById = new Map(ingredientRows.map((row) => [row.id, row.quantity]));

  const items = input.items.filter((item) => item.quantity !== undefined && item.quantity !== null);
  const extras = (input.extras ?? []).filter((extra) => extra.name.trim().length > 0);

  const status = resolveMealStatus(
    input.done,
    items.map((item) => ({
      plannedQuantity: plannedById.get(item.ingredientId) ?? null,
      eatenQuantity: item.quantity ?? null,
    })),
  );

  const values = {
    status,
    ...(input.notes !== undefined && { notes: input.notes }),
  };

  db.transaction((tx) => {
    let logId: number | undefined;

    if (existing) {
      tx.update(mealLogs).set(values).where(eq(mealLogs.id, existing.id)).run();
      logId = existing.id;
    } else {
      const created = tx
        .insert(mealLogs)
        .values({ meal_id: input.mealId, date: input.date, ...values })
        .returning()
        .get();
      logId = created?.id;
    }

    if (logId !== undefined) {
      replaceLogItems(tx, logId, items, extras);
    }
  });
}

type LogItemWriter = Pick<typeof db, 'insert' | 'delete'>;

function replaceLogItems(
  tx: LogItemWriter,
  mealLogId: number,
  items: MealIngredientInput[],
  extras: MealExtraInput[],
): void {
  tx.delete(mealLogItems).where(eq(mealLogItems.meal_log_id, mealLogId)).run();

  for (const item of items) {
    tx.insert(mealLogItems)
      .values({
        meal_log_id: mealLogId,
        ingredient_id: item.ingredientId,
        quantity: item.quantity ?? null,
      })
      .run();
  }

  for (const extra of extras) {
    tx.insert(mealLogItems)
      .values({
        meal_log_id: mealLogId,
        ingredient_id: null,
        name: extra.name.trim(),
        quantity: extra.quantity ?? null,
      })
      .run();
  }
}
