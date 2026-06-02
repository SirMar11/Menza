import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../../lib/client';

type User = { id: number; name: string; balance: number };

function AuthForm() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const res =
        mode === 'login'
          ? await client.auth.login.$post({ json: { name, password } })
          : await client.auth.register.$post({ json: { name, password } });
      const data = await res.json();
      if (!res.ok) throw new Error((data as any).error ?? 'Chyba');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setError('');
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div style={{ maxWidth: '300px' }}>
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setMode('login')}
          style={{ fontWeight: mode === 'login' ? 'bold' : 'normal', marginRight: '0.5rem' }}
        >
          Přihlásit se
        </button>
        <button
          onClick={() => setMode('register')}
          style={{ fontWeight: mode === 'register' ? 'bold' : 'normal' }}
        >
          Registrovat
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <input placeholder="Jméno" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          placeholder="Heslo"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mode === 'login' ? 'Přihlásit se' : 'Registrovat'}
        </button>
      </div>
    </div>
  );
}

function Profile({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');

  const logout = useMutation({
    mutationFn: async () => {
      await client.auth.logout.$post({});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const topup = useMutation({
    mutationFn: async (val: number) => {
      const res = await client.user.topup.$post({ json: { amount: val } });
      const data = await res.json();
      if (!res.ok) throw new Error((data as any).error ?? 'Chyba');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setAmount('');
      setAmountError('');
    },
    onError: (e: Error) => setAmountError(e.message),
  });

  const handleTopUp = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setAmountError('Zadejte kladnou částku');
      return;
    }
    topup.mutate(val);
  };

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await client.user.orders.$get();
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>{user.name}</h2>
          <p style={{ margin: '0.25rem 0' }}>
            Kredit: <strong>{user.balance} Kč</strong>
          </p>
        </div>
        <button onClick={() => logout.mutate()}>Odhlásit se</button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h3>Nabít kredit</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="number"
            min="1"
            placeholder="Částka (Kč)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: '120px' }}
          />
          <button onClick={handleTopUp} disabled={topup.isPending}>
            Nabít
          </button>
        </div>
        {amountError && <p style={{ color: 'red', margin: '0.25rem 0' }}>{amountError}</p>}
      </div>

      <div>
        <h3>Historie objednávek</h3>
        {orders.length === 0 && <p style={{ color: '#999' }}>Zatím žádné objednávky</p>}
        {orders.map((order) => (
          <div key={order.id} style={{ borderBottom: '1px solid #eee', padding: '0.5rem 0' }}>
            <span>{order.itemName}</span>
            <span style={{ float: 'right', color: '#666' }}>
              {order.pricePaid} Kč · {new Date(order.createdAt * 1000).toLocaleDateString('cs-CZ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function UserPage() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await client.user.me.$get();
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  if (isLoading) return <p>Načítám...</p>;
  return user ? <Profile user={user} /> : <AuthForm />;
}
