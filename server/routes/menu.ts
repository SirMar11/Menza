import { Hono } from 'hono';
import { and, eq, like } from 'drizzle-orm';
import { db } from '../db/index.js';
import { menuItems } from '../db/schema.js';

export const menuRoutes = new Hono()
  .get('/', async (c) => {
    const day = c.req.query('day');
    const tag = c.req.query('tag');

    const conditions = [
      day ? eq(menuItems.dayOfWeek, day) : undefined,
      tag ? like(menuItems.tags, `%"${tag}"%`) : undefined,
    ].filter(Boolean) as any[];

    const rows = await (conditions.length > 0
      ? db.select().from(menuItems).where(and(...conditions))
      : db.select().from(menuItems));

    return c.json(rows.map((item) => ({ ...item, tags: JSON.parse(item.tags) as string[] })));
  });
