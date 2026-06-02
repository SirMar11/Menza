import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

export function makeDb() {
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
