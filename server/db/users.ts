import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { users } from './schema.js';

export async function createUser(
  db: BetterSQLite3Database<any>,
  input: { name: string; password: string }
) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto
    .pbkdf2Sync(input.password, salt, 100_000, 64, 'sha512')
    .toString('hex');
  const token = crypto.randomBytes(32).toString('hex');

  await db.insert(users).values({
    name: input.name,
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
  input: { name: string; password: string }
) {
  const [user] = await db.select().from(users).where(eq(users.name, input.name));
  if (!user) return null;

  const hash = crypto
    .pbkdf2Sync(input.password, user.salt, 100_000, 64, 'sha512')
    .toString('hex');

  return hash === user.hash ? user : null;
}
