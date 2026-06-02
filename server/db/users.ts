import { eq, sql } from 'drizzle-orm';
import { users } from './schema.js';
import type { AppDb } from './types.js';
import { hashPassword, verifyHash, generateToken } from '../auth/hash.js';

export async function createUser(db: AppDb, input: { xname: string; password: string }) {
  const { salt, hash } = hashPassword(input.password);
  const token = generateToken();

  await db.insert(users).values({ xname: input.xname, salt, hash, token });

  return token;
}

export async function findUserByToken(db: AppDb, token: string) {
  const [user] = await db.select().from(users).where(eq(users.token, token));
  return user ?? null;
}

export async function verifyPassword(db: AppDb, input: { xname: string; password: string }) {
  const [user] = await db.select().from(users).where(eq(users.xname, input.xname));
  if (!user) return null;

  return verifyHash(input.password, user.salt, user.hash) ? user : null;
}

export async function topUp(db: AppDb, userId: number, amount: number) {
  if (amount <= 0) throw new Error('Částka musí být kladná');

  await db
    .update(users)
    .set({ balance: sql`${users.balance} + ${amount}` })
    .where(eq(users.id, userId));
}
