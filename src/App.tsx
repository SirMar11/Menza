import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { MenuPage } from './features/menu/MenuPage';
import { UserPage } from './features/user/UserPage';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { useOrderNotifications } from './hooks/useOrderNotifications';

const queryClient = new QueryClient();

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Přepnout na světlý mód' : 'Přepnout na tmavý mód'}
      title={theme === 'dark' ? 'Světlý mód' : 'Tmavý mód'}
      className="ml-auto w-9 h-9 flex items-center justify-center rounded-full text-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

function NotificationStack() {
  const { notifications, dismiss } = useOrderNotifications();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="toast-enter pointer-events-auto flex items-center gap-3 bg-surface text-text shadow-dropdown rounded-xl px-4 py-3 max-w-xs border border-divider"
        >
          <span className="text-xl select-none">🛒</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{n.xname}</p>
            <p className="text-xs text-muted truncate">objednal/a {n.itemName}</p>
          </div>
          <button
            onClick={() => dismiss(n.id)}
            aria-label="Zavřít"
            className="text-muted hover:text-text transition-colors text-lg leading-none shrink-0"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <header className="bg-primary shadow-nav sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-4 flex items-center h-14 gap-2">
              <span className="text-white font-bold text-xl mr-6 select-none">🍽️ Menza</span>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `h-14 flex items-center justify-center px-4 min-w-27.5 text-sm font-semibold border-b-2 transition-colors ${
                    isActive
                      ? 'text-white border-white'
                      : 'text-white/70 border-transparent hover:text-white hover:border-white/40'
                  }`
                }
              >
                Jídelníček
              </NavLink>
              <NavLink
                to="/user"
                className={({ isActive }) =>
                  `h-14 flex items-center justify-center px-4 min-w-27.5 text-sm font-semibold border-b-2 transition-colors ${
                    isActive
                      ? 'text-white border-white'
                      : 'text-white/70 border-transparent hover:text-white hover:border-white/40'
                  }`
                }
              >
                Uživatel
              </NavLink>
              <ThemeToggle />
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<MenuPage />} />
              <Route path="/user" element={<UserPage />} />
            </Routes>
          </main>

          <NotificationStack />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
