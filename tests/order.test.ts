import test from 'ava';
import { eq } from 'drizzle-orm';
import { users, menuItems, orders } from '../server/db/schema.js';
import { placeOrder } from '../server/db/orders.js';
import { makeDb } from './helpers.js';

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

  await t.throwsAsync(() => placeOrder(db, user.id, item.id), {
    message: 'Nedostatek kreditu',
  });
});

test('placeOrder odečte kredit a vytvoří záznam', async (t) => {
  const db = makeDb();
  const { user, item } = await seed(db);
  await db.update(users).set({ balance: 200 }).where(eq(users.id, user.id));

  await placeOrder(db, user.id, item.id);

  const [updatedUser] = await db.select().from(users);
  const allOrders = await db.select().from(orders);

  t.is(updatedUser.balance, 80, 'balance 200 - 120 = 80');
  t.is(allOrders.length, 1, 'objednávka byla zapsána');
  t.is(allOrders[0].pricePaid, 120);
  t.is(allOrders[0].userId, user.id);
});
