import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { db } from '../db/index.js';
import { findUserByToken } from '../db/users.js';

type User = {
  id: number;
  xname: string;
  balance: number;
  token: string | null;
};

// AuthEnv říká TypeScriptu, co je uloženo v c.Variables — bez toho by c.get('user') vracel unknown
export type AuthEnv = {
  Variables: {
    user: User | null;
  };
};

// Aplikovat na všechny routes — přečte cookie a vloží uživatele do kontextu (nebo null)
export const loadUser = createMiddleware<AuthEnv>(async (c, next) => {
  const token = getCookie(c, 'token');

  if (token) {
    const user = await findUserByToken(db, token);
    c.set('user', user);
  } else {
    c.set('user', null);
  }

  await next();
});

// Aplikovat jen na chráněné routes — vrátí 401 pokud loadUser nenašel uživatele
export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const user = c.get('user') as User | null;
  if (!user) {
    return c.json({ error: 'Nepřihlášen' }, 401);
  }
  await next();
});
