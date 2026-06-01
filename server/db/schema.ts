import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  salt: text('salt').notNull(),
  hash: text('hash').notNull(),
  token: text('token').unique(),
  balance: real('balance').notNull().default(0),
});

export const menuItems = sqliteTable('menu_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  dayOfWeek: text('day_of_week').notNull(),
  tags: text('tags').notNull().default('[]'),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  menuItemId: integer('menu_item_id')
    .notNull()
    .references(() => menuItems.id),
  pricePaid: real('price_paid').notNull(),
  createdAt: integer('created_at').notNull(),
});
