import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../../lib/client';

const DAYS = [
  { value: 'monday', label: 'Pondělí' },
  { value: 'tuesday', label: 'Úterý' },
  { value: 'wednesday', label: 'Středa' },
  { value: 'thursday', label: 'Čtvrtek' },
  { value: 'friday', label: 'Pátek' },
];

const TAGS = [
  { value: '', label: 'Vše' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarián' },
  { value: 'bez-lepku', label: 'Bez lepku' },
];

function getCurrentDay() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const day = days[new Date().getDay()];
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day) ? day : 'monday';
}

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
    <div>
      <div style={{ marginBottom: '1rem' }}>
        {DAYS.map((d) => (
          <button
            key={d.value}
            onClick={() => setDay(d.value)}
            style={{ marginRight: '0.5rem', fontWeight: day === d.value ? 'bold' : 'normal' }}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        {TAGS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTag(t.value)}
            style={{ marginRight: '0.5rem', fontWeight: tag === t.value ? 'bold' : 'normal' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <p>Načítám...</p>}

      {items.map((item) => (
        <div
          key={item.id}
          style={{
            border: '1px solid #ccc',
            padding: '1rem',
            marginBottom: '0.5rem',
            borderRadius: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{item.name}</strong>
              {item.description && (
                <p style={{ margin: '0.25rem 0', color: '#666' }}>{item.description}</p>
              )}
              <div>
                {item.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      background: '#e0f0e0',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '3px',
                      marginRight: '0.25rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>{item.price} Kč</strong>
              <br />
              {user ? (
                <button
                  onClick={() => buy.mutate(item.id)}
                  disabled={buy.isPending}
                  style={{ marginTop: '0.5rem' }}
                >
                  Koupit
                </button>
              ) : (
                <small style={{ color: '#999' }}>Přihlaste se</small>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
