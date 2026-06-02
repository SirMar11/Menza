import test from 'ava';
import Database from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { users, menuItems, orders } from '../server/db/schema.js';
import { placeOrder } from '../server/db/orders.js';

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite);
  sqlite.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      xname TEXT NOT NULL UNIQUE,
      salt TEXT NOT NULL,
      hash TEXT NOT NULL,
      token TEXT UNIQUE,
      balance REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      day_of_week TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]'
    );
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
      price_paid REAL NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
  return db;
}

async function seed(db: ReturnType<typeof makeDb>) {
  await db.insert(users).values({
    xname: 'Marek', salt: 'x', hash: 'x', token: 'tok',
  });
  await db.insert(menuItems).values({
    name: 'Svíčková', price: 120, dayOfWeek: 'monday', tags: '[]',
  });
  const [user] = await db.select().from(users);
  const [item] = await db.select().from(menuItems);
  return { user, item };
}

test('placeOrder selže při nedostatku kreditu', async (t) => {
  const db = makeDb();
  const { user, item } = await seed(db);
  // user má výchozí balance 0, jídlo stojí 120

  await t.throwsAsync(() => placeOrder(db, user.id, item.id), {
    message: 'Nedostatek kreditu',
  });
});

test('placeOrder odečte kredit a vytvoří záznam', async (t) => {
  const db = makeDb();
  const { user, item } = await seed(db);
  // nejdřív nabijeme kredit přímo v DB
    await db.update(users).set({ balance: 200 }).where(eq(users.id, user.id));


  await placeOrder(db, user.id, item.id);

  const [updatedUser] = await db.select().from(users);
  const allOrders = await db.select().from(orders);

  t.is(updatedUser.balance, 80, 'balance 200 - 120 = 80');
  t.is(allOrders.length, 1, 'objednávka byla zapsána');
  t.is(allOrders[0].pricePaid, 120);
  t.is(allOrders[0].userId, user.id);
});
