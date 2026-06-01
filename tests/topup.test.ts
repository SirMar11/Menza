import test from 'ava';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { users } from '../server/db/schema.js';
import { createUser, topUp } from '../server/db/users.js';

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

test('topUp zvýší kredit uživatele', async (t) => {
  const db = makeDb();
  await createUser(db, { name: 'Marek', password: 'heslo123' });
  const [before] = await db.select().from(users);

  await topUp(db, before.id, 100);

  const [after] = await db.select().from(users);
  t.is(after.balance, 100);
});

test('topUp odmítne zápornou částku', async (t) => {
  const db = makeDb();
  await createUser(db, { name: 'Marek', password: 'heslo123' });
  const [user] = await db.select().from(users);

  await t.throwsAsync(() => topUp(db, user.id, -50), {
    message: 'Částka musí být kladná',
  });
});

test('topUp odmítne nulovou částku', async (t) => {
  const db = makeDb();
  await createUser(db, { name: 'Marek', password: 'heslo123' });
  const [user] = await db.select().from(users);

  await t.throwsAsync(() => topUp(db, user.id, 0), {
    message: 'Částka musí být kladná',
  });
});
