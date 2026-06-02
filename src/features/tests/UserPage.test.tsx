import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserPage } from '../UserPage';

vi.mock('../../lib/client', () => ({
  client: {
    user: {
      me: { $get: vi.fn().mockResolvedValue({ ok: false }) },
    },
    auth: {
      login: { $post: vi.fn() },
      register: { $post: vi.fn() },
    },
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

it('AuthForm: přepnutí do režimu registrace změní text tlačítka', async () => {
  const user = userEvent.setup();
  render(<UserPage />, { wrapper });

  // Počkej na formulář (me query vrátí null → uživatel není přihlášen)
  await screen.findByRole('button', { name: 'Registrovat' });

  // V login režimu: "Přihlásit se" je záložka i submit tlačítko → 2×
  expect(screen.getAllByRole('button', { name: 'Přihlásit se' })).toHaveLength(2);

  // Klikni na záložku "Registrovat"
  await user.click(screen.getByRole('button', { name: 'Registrovat' }));

  // Teď "Registrovat" je záložka i submit → 2×
  expect(screen.getAllByRole('button', { name: 'Registrovat' })).toHaveLength(2);
});
