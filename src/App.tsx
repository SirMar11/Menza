import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { MenuPage } from './features/MenuPage';
import { UserPage } from './features/UserPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <header className="bg-primary shadow-nav sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 flex items-center h-14 gap-2">
            <span className="text-white font-bold text-xl mr-6 select-none">🍽️ Menza</span>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `h-14 flex items-center px-4 text-sm font-semibold border-b-2 transition-colors ${
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
                `h-14 flex items-center px-4 text-sm font-semibold border-b-2 transition-colors ${
                  isActive
                    ? 'text-white border-white'
                    : 'text-white/70 border-transparent hover:text-white hover:border-white/40'
                }`
              }
            >
              Uživatel
            </NavLink>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/user" element={<UserPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
