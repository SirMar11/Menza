import type { WSContext } from 'hono/ws';

// Set automaticky deduplicuje spojení a nabízí O(1) přidání/odebrání
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
      // Mrtvé spojení — klient se odpojil bez čistého close eventu, odebereme ho
      clients.delete(client);
    }
  }
}
