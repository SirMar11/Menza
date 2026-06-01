import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { authRoutes } from './routes/auth.js';

const app = new Hono()
  .route('/auth', authRoutes);

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('Server běží na http://localhost:3000');
});

export type AppType = typeof app;
