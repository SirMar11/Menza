import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserPage } from '../user/UserPage';

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

it('AuthForm: kliknutí na "Vytvořit nový účet" přepne na registrační formulář', async () => {
  const user = userEvent.setup();
  render(<UserPage />, { wrapper });

  // Počkej na login formulář
  await screen.findByRole('button', { name: 'Přihlásit se' });

  // V login režimu je submit "Přihlásit se" a přepínač "Vytvořit nový účet"
  expect(screen.getByRole('button', { name: 'Přihlásit se' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Vytvořit nový účet' })).toBeInTheDocument();

  // Klikni na přepínač
  await user.click(screen.getByRole('button', { name: 'Vytvořit nový účet' }));

  // Registrační formulář: submit říká "Registrovat", přepínač "← Zpět na přihlášení"
  expect(screen.getByRole('button', { name: 'Registrovat' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '← Zpět na přihlášení' })).toBeInTheDocument();
});
