import { useEffect, useState } from 'react';
import { WS_URL } from '../lib/config';

export type OrderNotification = {
  id: number;
  xname: string;
  itemName: string;
};

export function useOrderNotifications() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    // Příznak brání reconnectu při záměrném zavření (cleanup, React StrictMode double-mount)
    let intentionallyClosed = false;

    const connect = () => {
      ws = new WebSocket(WS_URL);

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type !== 'order') return;

          const notification: OrderNotification = { id: Date.now(), ...data };
          setNotifications((prev) => [...prev, notification]);

          // Automaticky odstraní notifikaci po 4,5 sekundách
          setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
          }, 4500);
        } catch {
          // Ignorujeme malformed zprávy ze serveru
        }
      };

      ws.onclose = () => {
        if (!intentionallyClosed) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    return () => {
      intentionallyClosed = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  const dismiss = (id: number) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  return { notifications, dismiss };
}
