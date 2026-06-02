import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { MenuPage } from './features/MenuPage';
import { UserPage } from './features/UserPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <h1>VŠE Menza</h1>
        <nav
          style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ccc' }}
        >
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({ fontWeight: isActive ? 'bold' : 'normal' })}
          >
            Jídelníček
          </NavLink>
          <NavLink
            to="/user"
            style={({ isActive }) => ({ fontWeight: isActive ? 'bold' : 'normal' })}
          >
            Uživatel
          </NavLink>
        </nav>
        <main style={{ padding: '1rem' }}>
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/user" element={<UserPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
