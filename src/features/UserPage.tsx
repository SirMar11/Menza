import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../lib/client';

type User = { id: number; xname: string; balance: number };

const inputCls =
  'w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors';

const btnPrimary =
  'w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary-hover active:bg-primary-press disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

const btnSuccess =
  'w-full bg-success text-white font-bold py-2.5 rounded-lg hover:bg-success-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2';

function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-divider" />
      {label && <span className="text-muted text-xs">{label}</span>}
      <div className="flex-1 h-px bg-divider" />
    </div>
  );
}

function AuthForm() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [xname, setXname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const res =
        mode === 'login'
          ? await client.auth.login.$post({ json: { xname, password } })
          : await client.auth.register.$post({ json: { xname, password } });
      const data = await res.json();
      if (!res.ok) throw new Error((data as any).error ?? 'Chyba');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setError('');
    },
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="flex flex-col items-center justify-start pt-8 min-h-[60vh]">
      {/* Brand */}
      <div className="text-center mb-6">
        <p className="text-5xl mb-2">🍽️</p>
        <p className="text-muted text-sm max-w-xs">
          Přihlaste se a objednejte si oběd jednoduše online.
        </p>
      </div>

      {mode === 'login' ? (
        <div className="bg-surface rounded-xl shadow-card p-4 w-full max-w-sm space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              className={inputCls}
              placeholder="Jméno"
              value={xname}
              onChange={(e) => setXname(e.target.value)}
              autoComplete="username"
            />
            <input
              className={inputCls}
              placeholder="Heslo"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error && (
              <p className="text-sm text-danger bg-danger/8 border border-danger/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button type="submit" className={btnPrimary} disabled={mutation.isPending}>
              {mutation.isPending ? 'Přihlašuji…' : 'Přihlásit se'}
            </button>
          </form>

          <Divider label="nebo" />

          <button className={btnSuccess} onClick={() => { setMode('register'); setError(''); }}>
            Vytvořit nový účet
          </button>
        </div>
      ) : (
        <div className="bg-surface rounded-xl shadow-card p-4 w-full max-w-sm space-y-3">
          <div className="pb-3 border-b border-divider">
            <h2 className="text-xl font-bold text-text">Vytvořit nový účet</h2>
            <p className="text-sm text-muted mt-0.5">Je to rychlé a jednoduché.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              className={inputCls}
              placeholder="Jméno (min. 2 znaky)"
              value={xname}
              onChange={(e) => setXname(e.target.value)}
              autoComplete="username"
            />
            <input
              className={inputCls}
              placeholder="Heslo (min. 6 znaků)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            {error && (
              <p className="text-sm text-danger bg-danger/8 border border-danger/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button type="submit" className={btnSuccess} disabled={mutation.isPending}>
              {mutation.isPending ? 'Registruji…' : 'Registrovat'}
            </button>
          </form>
          <button
            className="w-full text-sm text-muted hover:text-text transition-colors py-1"
            onClick={() => { setMode('login'); setError(''); }}
          >
            ← Zpět na přihlášení
          </button>
        </div>
      )}
    </div>
  );
}

function Profile({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');

  const logout = useMutation({
    mutationFn: async () => { await client.auth.logout.$post({}); },
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

  const handleTopUp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) { setAmountError('Zadejte kladnou částku'); return; }
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
    <div className="space-y-4 max-w-lg">
      {/* Profile card */}
      <div className="bg-surface rounded-xl shadow-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold select-none">
            {user.xname.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-text">{user.xname}</p>
            <p className="text-sm text-muted">
              Kredit: <span className="text-primary font-bold">{user.balance} Kč</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="text-sm text-muted hover:text-danger transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-danger/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
        >
          {logout.isPending ? '…' : 'Odhlásit se'}
        </button>
      </div>

      {/* Top-up card */}
      <div className="bg-surface rounded-xl shadow-card p-4">
        <h3 className="font-semibold text-text mb-3">Nabít kredit</h3>
        <form onSubmit={handleTopUp} className="flex gap-2">
          <input
            type="number"
            min="1"
            step="any"
            placeholder="Částka (Kč)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={topup.isPending}
            className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-hover active:bg-primary-press disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 whitespace-nowrap"
          >
            {topup.isPending ? '…' : 'Nabít'}
          </button>
        </form>
        {amountError && (
          <p className="text-sm text-danger mt-2">{amountError}</p>
        )}
      </div>

      {/* Order history */}
      <div className="bg-surface rounded-xl shadow-card p-4">
        <h3 className="font-semibold text-text mb-3">Historie objednávek</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">Zatím žádné objednávky.</p>
        ) : (
          <ul className="divide-y divide-divider">
            {orders.map((order) => (
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
        )}
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

  if (isLoading) {
    return (
      <div className="flex justify-center pt-16">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <Profile user={user} /> : <AuthForm />;
}
