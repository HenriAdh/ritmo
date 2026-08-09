import * as Crypto from 'expo-crypto';
import { eq } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { settings, users } from '@/src/db/schema';
import type { User } from '@/src/types';

const SALT_BYTES = 16;

async function generateSalt(): Promise<string> {
  const bytes = Crypto.getRandomBytes(SALT_BYTES);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}${password}`);
}

export type AuthCredentials = {
  name: string;
  password: string;
};

export async function registerUser({ name, password }: AuthCredentials): Promise<User> {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error('Informe seu nome');
  }
  if (password.length < 4) {
    throw new Error('A senha precisa ter pelo menos 4 caracteres');
  }

  const existing = await db.select().from(users).where(eq(users.name, normalizedName)).limit(1);
  if (existing.length > 0) {
    throw new Error('Este nome já está em uso');
  }

  const salt = await generateSalt();
  const hash = await hashPassword(password, salt);

  const [user] = await db
    .insert(users)
    .values({ name: normalizedName, password_hash: `${salt}:${hash}` })
    .returning();

  await db.insert(settings).values({ user_id: user.id });

  return user;
}

export async function loginUser({ name, password }: AuthCredentials): Promise<User> {
  const normalizedName = name.trim();
  const [user] = await db.select().from(users).where(eq(users.name, normalizedName)).limit(1);
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const [salt, expectedHash] = user.password_hash.split(':');
  const hash = await hashPassword(password, salt ?? '');
  if (hash !== expectedHash) {
    throw new Error('Senha incorreta');
  }

  return user;
}
