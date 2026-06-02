import type { WSContext } from 'hono/ws';

const clients = new Set<WSContext>();

export function addClient(ws: WSContext) {
  clients.add(ws);
}

export function removeClient(ws: WSContext) {
  clients.delete(ws);
}

export function broadcast(payload: { type: string; xname: string; itemName: string }) {
  const json = JSON.stringify(payload);
  for (const client of clients) {
    try {
      client.send(json);
    } catch {
      clients.delete(client);
    }
  }
}
