import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { client } from '../../lib/client';

// Výchozí počet zobrazených objednávek — zbytek se rozbalí na vyžádání
const PAGE_SIZE = 5;

export function OrderHistory() {
  const [expanded, setExpanded] = useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await client.user.orders.$get();
      if (!res.ok) return [];
      return res.json();
    },
  });

  const totalSpent = orders.reduce((sum, o) => sum + o.pricePaid, 0);
  const visible = expanded ? orders : orders.slice(0, PAGE_SIZE);
  const hiddenCount = orders.length - PAGE_SIZE;

  return (
    <div className="bg-surface rounded-xl shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text">Historie objednávek</h3>
        {orders.length > 0 && (
          <span className="text-xs text-muted">
            celkem utraceno: <span className="text-primary font-semibold">{totalSpent} Kč</span>
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-muted text-center py-4">Zatím žádné objednávky.</p>
      ) : (
        <>
          <ul className="divide-y divide-divider">
            {visible.map((order) => (
              <li key={order.id} className="flex justify-between items-center py-2.5 text-sm">
                <span className="text-text font-medium">{order.itemName}</span>
                <div className="text-right">
                  <span className="text-primary font-semibold">{order.pricePaid} Kč</span>
                  <p className="text-xs text-muted">
                    {new Date(order.createdAt * 1000).toLocaleDateString('cs-CZ')}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {hiddenCount > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 w-full text-sm text-primary font-medium hover:text-primary-hover transition-colors py-1.5 rounded-lg hover:bg-primary/5"
            >
              {expanded ? 'Zobrazit méně ↑' : `Zobrazit dalších ${hiddenCount} objednávek ↓`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
