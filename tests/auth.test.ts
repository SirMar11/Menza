import test from 'ava';
import { users } from '../server/db/schema.js';
import { createUser, verifyPassword } from '../server/db/users.js';
import { makeDb } from './helpers.js';

test('createUser uloží uživatele a hash se nerovná heslu', async (t) => {
  const db = makeDb();
  const password = 'tajneHeslo123';

  await createUser(db, { xname: 'Marek', password });

  const [user] = await db.select().from(users);

  t.truthy(user, 'uživatel byl uložen do databáze');
  t.is(user.xname, 'Marek');
  t.not(user.hash, password, 'hash se nesmí rovnat heslu');
  t.truthy(user.salt, 'salt musí existovat');
  t.truthy(user.hash, 'hash musí existovat');
});

test('verifyPassword vrátí uživatele při správném hesle', async (t) => {
  const db = makeDb();
  await createUser(db, { xname: 'Marek', password: 'tajneHeslo123' });

  const user = await verifyPassword(db, { xname: 'Marek', password: 'tajneHeslo123' });

  t.truthy(user, 'funkce vrátí uživatele');
  t.is(user?.xname, 'Marek');
});

test('verifyPassword vrátí null při špatném hesle', async (t) => {
  const db = makeDb();
  await createUser(db, { xname: 'Marek', password: 'tajneHeslo123' });

  const user = await verifyPassword(db, { xname: 'Marek', password: 'spatneHeslo' });

  t.is(user, null, 'špatné heslo musí vrátit null');
});
