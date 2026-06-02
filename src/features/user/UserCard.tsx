import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../../lib/client';

type User = { id: number; xname: string; balance: number };

export function UserCard({ user }: { user: User }) {
  const queryClient = useQueryClient();

  const logout = useMutation({
    mutationFn: async () => { await client.auth.logout.$post({}); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return (
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
  );
}
