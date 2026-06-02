import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../../lib/client';
import { getCurrentDay } from '../../lib/utils';
import { MenuItemCard } from './MenuItemCard';

const DAYS = [
  { value: 'monday',    label: 'Pondělí' },
  { value: 'tuesday',   label: 'Úterý' },
  { value: 'wednesday', label: 'Středa' },
  { value: 'thursday',  label: 'Čtvrtek' },
  { value: 'friday',    label: 'Pátek' },
];

const TAGS = [
  { value: '',           label: 'Vše' },
  { value: 'vegan',      label: '🌱 Vegan' },
  { value: 'vegetarian', label: '🥗 Vegetarián' },
  { value: 'bez-lepku',  label: '🌾 Bez lepku' },
];

export function MenuPage() {
  const queryClient = useQueryClient();
  const [day, setDay] = useState(getCurrentDay());
  const [tag, setTag] = useState('');
  const [buyError, setBuyError] = useState<string | null>(null);

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
      const data = await res.json() as { error: string };
      if (!res.ok) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setBuyError(null);
    },
    onError: (e: Error) => setBuyError(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {DAYS.map((d) => (
          <button
            key={d.value}
            onClick={() => setDay(d.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              day === d.value ? 'bg-primary text-white shadow-sm' : 'bg-surface text-muted hover:bg-divider'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

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

      {buyError && (
        <div className="flex items-center justify-between bg-danger/8 border border-danger/20 rounded-lg px-4 py-2.5 text-sm text-danger">
          <span>{buyError}</span>
          <button onClick={() => setBuyError(null)} className="ml-2 font-bold hover:opacity-70 text-base leading-none">×</button>
        </div>
      )}

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
          <MenuItemCard
            key={item.id}
            item={item}
            onBuy={(id) => buy.mutate(id)}
            buyPending={buy.isPending}
            isLoggedIn={!!user}
          />
        ))}
      </div>
    </div>
  );
}
