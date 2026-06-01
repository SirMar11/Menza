import test from 'ava';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { users } from '../server/db/schema.js';
import { createUser } from '../server/db/users.js';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite);
  sqlite.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      salt TEXT NOT NULL,
      hash TEXT NOT NULL,
      token TEXT UNIQUE,
      balance REAL NOT NULL DEFAULT 0
    )
  `);
  return db;
}

test('createUser uloží uživatele a hash se nerovná heslu', async (t) => {
  const db = makeDb();
  const password = 'tajneHeslo123';

  await createUser(db, { name: 'Marek', password });

  const [user] = await db.select().from(users);

  t.truthy(user, 'uživatel byl uložen do databáze');
  t.is(user.name, 'Marek');
  t.not(user.hash, password, 'hash se nesmí rovnat heslu');
  t.truthy(user.salt, 'salt musí existovat');
  t.truthy(user.hash, 'hash musí existovat');
});
