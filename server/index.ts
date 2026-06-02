import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createNodeWebSocket } from '@hono/node-ws';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/user.js';
import { menuRoutes } from './routes/menu.js';
import { loadUser } from './middleware/auth.js';
import { seedMenu } from './db/seed.js';
import { addClient, removeClient } from './ws.js';

// Vloží ukázková jídla do DB pokud je prázdná — při každém startu serveru
await seedMenu();

// Chained zápis je nutný — TypeScript zachytí typy routes do AppType pouze z návratové hodnoty řetězce
const app = new Hono()
  .use(cors({ origin: 'http://localhost:5173', credentials: true }))
  .use(loadUser)
  .route('/auth', authRoutes)
  .route('/user', userRoutes)
  .route('/menu', menuRoutes);

// Exportovat před přidáním WS route — /ws endpoint nepotřebuje být součástí RPC typů frontendu
export type AppType = typeof app;

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.get('/ws', upgradeWebSocket(() => ({
  onOpen(_, ws) { addClient(ws); },
  onClose(_, ws) { removeClient(ws); },
})));

const server = serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('Server běží na http://localhost:3000');
});

injectWebSocket(server);
