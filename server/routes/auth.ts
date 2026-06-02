import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { z } from 'zod';
import { db } from '../db/index.js';
import { createUser, verifyPassword } from '../db/users.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Jméno musí mít alespoň 2 znaky'),
  password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků'),
});

const loginSchema = z.object({
  name: z.string().min(1),
  password: z.string().min(1),
});

export const authRoutes = new Hono()
  .post('/register', async (c) => {
    const body = await c.req.json();
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: result.error.issues[0]?.message ?? 'Neplatná data' }, 400);
    }

    const token = await createUser(db, result.data);
    setCookie(c, 'token', token, { httpOnly: true, path: '/' });
    return c.json({ ok: true }, 201);
  })
  .post('/login', async (c) => {
    const body = await c.req.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: 'Neplatná data' }, 400);
    }

    const user = await verifyPassword(db, result.data);
    if (!user || !user.token) {
      return c.json({ error: 'Špatné jméno nebo heslo' }, 401);
    }

    setCookie(c, 'token', user.token, { httpOnly: true, path: '/' });
    return c.json({ ok: true });
  })
  .post('/logout', (c) => {
    deleteCookie(c, 'token', { path: '/' });
    return c.json({ ok: true });
  });
