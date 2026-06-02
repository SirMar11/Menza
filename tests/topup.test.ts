import test from 'ava';
import { users } from '../server/db/schema.js';
import { createUser, topUp } from '../server/db/users.js';
import { makeDb } from './helpers.js';

test('topUp zvýší kredit uživatele', async (t) => {
  const db = makeDb();
  await createUser(db, { xname: 'Marek', password: 'heslo123' });
  const [before] = await db.select().from(users);

  await topUp(db, before.id, 100);

  const [after] = await db.select().from(users);
  t.is(after.balance, 100);
});

test('topUp odmítne zápornou částku', async (t) => {
  const db = makeDb();
  await createUser(db, { xname: 'Marek', password: 'heslo123' });
  const [user] = await db.select().from(users);

  await t.throwsAsync(() => topUp(db, user.id, -50), {
    message: 'Částka musí být kladná',
  });
});

test('topUp odmítne nulovou částku', async (t) => {
  const db = makeDb();
  await createUser(db, { xname: 'Marek', password: 'heslo123' });
  const [user] = await db.select().from(users);

  await t.throwsAsync(() => topUp(db, user.id, 0), {
    message: 'Částka musí být kladná',
  });
});
