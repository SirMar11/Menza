type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  tags: string[];
};

type Props = {
  item: MenuItem;
  onBuy: (id: number) => void;
  buyPending: boolean;
  isLoggedIn: boolean;
};

export function MenuItemCard({ item, onBuy, buyPending, isLoggedIn }: Props) {
  return (
    <div className="bg-surface rounded-xl shadow-card p-4 hover:shadow-dropdown transition-shadow">
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
          {isLoggedIn ? (
            <button
              onClick={() => onBuy(item.id)}
              disabled={buyPending}
              className="bg-primary text-white text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-primary-hover active:bg-primary-press disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {buyPending ? '…' : 'Koupit'}
            </button>
          ) : (
            <span className="text-xs text-muted italic">Přihlaste se</span>
          )}
        </div>
      </div>
    </div>
  );
}
