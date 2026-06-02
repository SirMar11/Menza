import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { topUp } from '../db/users.js';
import { placeOrder } from '../db/orders.js';
import { orders, menuItems } from '../db/schema.js';
import type { AuthEnv } from '../middleware/auth.js';

const topUpSchema = z.object({
  amount: z.number().positive('Částka musí být kladné číslo'),
});

const orderSchema = z.object({
  menuItemId: z.number().int().positive(),
});

export const userRoutes = new Hono<AuthEnv>()
  .get('/me', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Nepřihlášen' }, 401);
    return c.json({ id: user.id, xname: user.xname, balance: user.balance });
  })
  .post('/topup', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Nepřihlášen' }, 401);

    const body = await c.req.json();
    const result = topUpSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: result.error.issues[0]?.message ?? 'Neplatná data' }, 400);
    }

    await topUp(db, user.id, result.data.amount);
    return c.json({ ok: true });
  })
  .post('/orders', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Nepřihlášen' }, 401);

    const body = await c.req.json();
    const result = orderSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: result.error.issues[0]?.message ?? 'Neplatná data' }, 400);
    }

    try {
      await placeOrder(db, user.id, result.data.menuItemId);
      return c.json({ ok: true }, 201);
    } catch (e: any) {
      return c.json({ error: e.message }, 400);
    }
  })
  .get('/orders', async (c) => {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Nepřihlášen' }, 401);

    const history = await db
      .select({
        id: orders.id,
        pricePaid: orders.pricePaid,
        createdAt: orders.createdAt,
        itemName: menuItems.name,
      })
      .from(orders)
      .innerJoin(menuItems, eq(orders.menuItemId, menuItems.id))
      .where(eq(orders.userId, user.id));

    return c.json(history);
  });
