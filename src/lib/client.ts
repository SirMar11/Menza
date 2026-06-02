import { hc } from 'hono/client';
import type { AppType } from '../../server/index.js';

export const client = hc<AppType>('http://localhost:3000', {
  init: { credentials: 'include' },
});