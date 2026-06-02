import { hc } from 'hono/client';
import type { AppType } from '../../server/index.js';
import { API_URL } from './config';

export const client = hc<AppType>(API_URL, {
  init: { credentials: 'include' },
});
