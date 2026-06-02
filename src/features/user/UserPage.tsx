import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../../lib/client';
import { Divider } from '../../components/Divider';
import { UserCard } from './UserCard';
import { TopUpForm } from './TopUpForm';
import { OrderHistory } from './OrderHistory';

type User = { id: number; xname: string; balance: number };

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['me'] }); setError(''); },
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="flex flex-col items-center justify-start pt-8 min-h-[60vh]">
      <div className="text-center mb-6">
        <p className="text-5xl mb-2">🍽️</p>
        <p className="text-muted text-sm max-w-xs">Přihlaste se a objednejte si oběd jednoduše online.</p>
      </div>

      {mode === 'login' ? (
        <div className="bg-surface rounded-xl shadow-card p-4 w-full max-w-sm space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              placeholder="Jméno"
              value={xname}
              onChange={(e) => setXname(e.target.value)}
              autoComplete="username"
            />
            <input
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              placeholder="Heslo"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error && <p className="text-sm text-danger bg-danger/8 border border-danger/20 rounded-lg px-3 py-2">{error}</p>}
            <button
              type="submit"
              className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary-hover active:bg-primary-press disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Přihlašuji…' : 'Přihlásit se'}
            </button>
          </form>
          <Divider label="nebo" />
          <button
            className="w-full bg-success text-white font-bold py-2.5 rounded-lg hover:bg-success-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2"
            onClick={() => { setMode('register'); setError(''); }}
          >
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
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              placeholder="Jméno (min. 2 znaky)"
              value={xname}
              onChange={(e) => setXname(e.target.value)}
              autoComplete="username"
            />
            <input
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              placeholder="Heslo (min. 6 znaků)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            {error && <p className="text-sm text-danger bg-danger/8 border border-danger/20 rounded-lg px-3 py-2">{error}</p>}
            <button
              type="submit"
              className="w-full bg-success text-white font-bold py-2.5 rounded-lg hover:bg-success-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2"
              disabled={mutation.isPending}
            >
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
  return (
    <div className="space-y-4">
      <UserCard user={user} />
      <TopUpForm />
      <OrderHistory />
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
