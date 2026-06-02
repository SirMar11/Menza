import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../lib/client';
import { getCurrentDay } from '../lib/utils';

const DAYS = [
  { value: 'monday',    label: 'Pondělí' },
  { value: 'tuesday',   label: 'Úterý' },
  { value: 'wednesday', label: 'Středa' },
  { value: 'thursday',  label: 'Čtvrtek' },
  { value: 'friday',    label: 'Pátek' },
];

const TAGS = [
  { value: '',          label: 'Vše' },
  { value: 'vegan',     label: '🌱 Vegan' },
  { value: 'vegetarian',label: '🥗 Vegetarián' },
  { value: 'bez-lepku', label: '🌾 Bez lepku' },
];

export function MenuPage() {
  const queryClient = useQueryClient();
  const [day, setDay] = useState(getCurrentDay());
  const [tag, setTag] = useState('');

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await client.user.me.$get();
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['menu', day, tag],
    queryFn: async () => {
      const res = await client.menu.list.$get({ query: { day, tag } });
      return res.json();
    },
  });

  const buy = useMutation({
    mutationFn: async (menuItemId: number) => {
      const res = await client.user.orders.$post({ json: { menuItemId } });
      const data = await res.json();
      if (!res.ok) throw new Error((data as any).error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
    onError: (e: Error) => alert(e.message),
  });

  return (
    <div className="space-y-4">
      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {DAYS.map((d) => (
          <button
            key={d.value}
            onClick={() => setDay(d.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              day === d.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface text-muted hover:bg-divider'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Tag filter */}
      <div className="flex gap-2 flex-wrap">
        {TAGS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTag(t.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              tag === t.value
                ? 'bg-primary/10 text-primary border-primary/30 font-semibold'
                : 'bg-surface text-muted border-border hover:border-primary/40 hover:text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Items */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-surface rounded-xl shadow-card p-4 animate-pulse">
              <div className="h-4 bg-divider rounded w-1/2 mb-2" />
              <div className="h-3 bg-divider rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-semibold">Žádná jídla nenalezena</p>
          <p className="text-sm mt-1">Zkus jiný den nebo odeber filtr.</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-surface rounded-xl shadow-card p-4 hover:shadow-dropdown transition-shadow"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text">{item.name}</p>
                {item.description && (
                  <p className="text-sm text-muted mt-0.5 truncate">{item.description}</p>
                )}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-primary font-bold text-lg">{item.price} Kč</span>
                {user ? (
                  <button
                    onClick={() => buy.mutate(item.id)}
                    disabled={buy.isPending}
                    className="bg-primary text-white text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-primary-hover active:bg-primary-press disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {buy.isPending ? '…' : 'Koupit'}
                  </button>
                ) : (
                  <span className="text-xs text-muted italic">Přihlaste se</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
