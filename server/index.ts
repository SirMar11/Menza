import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/user.js';
import { menuRoutes } from './routes/menu.js';
import { loadUser } from './middleware/auth.js';
import { seedMenu } from './db/seed.js';

await seedMenu();

const app = new Hono()
  .use(cors({ origin: 'http://localhost:5173', credentials: true }))
  .use(loadUser)
  .route('/auth', authRoutes)
  .route('/user', userRoutes)
  .route('/menu', menuRoutes);

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('Server běží na http://localhost:3000');
});

export type AppType = typeof app;