import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../lib/client';

export function TopUpForm() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const topup = useMutation({
    mutationFn: async (val: number) => {
      const res = await client.user.topup.$post({ json: { amount: val } });
      const data = await res.json();
      if (!res.ok) throw new Error((data as any).error ?? 'Chyba');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setAmount('');
      setError('');
    },
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) { setError('Zadejte kladnou částku'); return; }
    topup.mutate(val);
  };

  return (
    <div className="bg-surface rounded-xl shadow-card p-4">
      <h3 className="font-semibold text-text mb-3">Nabít kredit</h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
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
      {error && <p className="text-sm text-danger mt-2">{error}</p>}
    </div>
  );
}
