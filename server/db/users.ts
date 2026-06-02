import crypto from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { users } from './schema.js';

export async function createUser(
  db: BetterSQLite3Database<any>,
  input: { xname: string; password: string }
) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto
    .pbkdf2Sync(input.password, salt, 100_000, 64, 'sha512')
    .toString('hex');
  const token = crypto.randomBytes(32).toString('hex');

  await db.insert(users).values({
    xname: input.xname,
    salt,
    hash,
    token,
  });

  return token;
}

export async function findUserByToken(
  db: BetterSQLite3Database<any>,
  token: string
) {
  const [user] = await db.select().from(users).where(eq(users.token, token));
  return user ?? null;
}

export async function verifyPassword(
  db: BetterSQLite3Database<any>,
  input: { xname: string; password: string }
) {
  const [user] = await db.select().from(users).where(eq(users.xname, input.xname));
  if (!user) return null;

  const hash = crypto
    .pbkdf2Sync(input.password, user.salt, 100_000, 64, 'sha512')
    .toString('hex');

  return hash === user.hash ? user : null;
}

export async function topUp(
  db: BetterSQLite3Database<any>,
  userId: number,
  amount: number
) {
  if (amount <= 0) {
    throw new Error('Částka musí být kladná');
  }

  await db
    .update(users)
    .set({ balance: sql`${users.balance} + ${amount}` })
    .where(eq(users.id, userId));
}