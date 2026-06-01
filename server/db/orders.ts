import { eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { users, menuItems, orders } from './schema.js';

export async function placeOrder(
  db: BetterSQLite3Database<any>,
  userId: number,
  menuItemId: number
) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const [item] = await db.select().from(menuItems).where(eq(menuItems.id, menuItemId));

  if (!user || !item) throw new Error('Uživatel nebo jídlo nenalezeno');
  if (user.balance < item.price) throw new Error('Nedostatek kreditu');

  db.transaction((tx) => {
    tx.update(users)
      .set({ balance: sql`${users.balance} - ${item.price}` })
      .where(eq(users.id, userId))
      .run();

    tx.insert(orders).values({
      userId,
      menuItemId,
      pricePaid: item.price,
      createdAt: Math.floor(Date.now() / 1000),
    }).run();
  });
}
