import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { weighIns } from '@/src/db/schema';
import type { WeighIn } from '@/src/types';

export type WeighInInput = {
  date: string;
  weight: number;
  photoUri?: string | null;
};

export async function listWeighIns(userId: number): Promise<WeighIn[]> {
  return db
    .select()
    .from(weighIns)
    .where(eq(weighIns.user_id, userId))
    .orderBy(weighIns.date, weighIns.id);
}

export async function getWeighInForDate(userId: number, date: string): Promise<WeighIn | null> {
  const [row] = await db
    .select()
    .from(weighIns)
    .where(and(eq(weighIns.user_id, userId), eq(weighIns.date, date)))
    .limit(1);
  return row ?? null;
}

export async function getCurrentWeighIn(userId: number): Promise<WeighIn | null> {
  const [row] = await db
    .select()
    .from(weighIns)
    .where(eq(weighIns.user_id, userId))
    .orderBy(desc(weighIns.date), desc(weighIns.id))
    .limit(1);
  return row ?? null;
}

// Sem índice único em (user_id, date): pesar duas vezes no mesmo dia é legítimo
// e someira a primeira das duas. A tela do dia é quem escolhe qual editar.
export async function saveWeighIn(userId: number, input: WeighInInput): Promise<void> {
  const existing = await getWeighInForDate(userId, input.date);
  const values = {
    weight: input.weight,
    photo_uri: input.photoUri ?? null,
  };

  if (existing) {
    db.update(weighIns).set(values).where(eq(weighIns.id, existing.id)).run();
    return;
  }

  db.insert(weighIns).values({ user_id: userId, date: input.date, ...values }).run();
}

export async function deleteWeighIn(id: number): Promise<void> {
  db.delete(weighIns).where(eq(weighIns.id, id)).run();
}
