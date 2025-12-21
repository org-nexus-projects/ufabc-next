import { createPinia, setActivePinia } from 'pinia';

import { user as mockedUser } from '@/mocks/users';
import { useAuthStore } from '@/stores/auth';
import { render, screen, userEvent, waitFor } from '@/test-utils';

import { AppBar } from '.';

describe('<AppBar />', () => {
  let authStore: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    authStore.authenticate('mock-token');
    authStore.user = mockedUser;
  });

  afterEach(() => {
    authStore.logOut();
  });

  test('render app bar', () => {
    render(AppBar);
    expect(
      screen.getAllByRole('img', { name: 'logo do UFABC Next' }),
    ).toHaveLength(2);
    expect(screen.getByText('Reviews')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Snapshot da Matrícula')).toBeInTheDocument();
    expect(screen.getByText('Grupos no WhatsApp')).toBeInTheDocument();
  });
  test('render theme toggle button', () => {
    render(AppBar);

    expect(
      screen.getByRole('button', { name: 'Toggle theme' }),
    ).toBeInTheDocument();
  });

  test('toggle between sun and moon icons', async () => {
    const user = userEvent.setup();

    render(AppBar);

    const toggleButton = screen.getByRole('button', { name: 'Toggle theme' });
    expect(toggleButton).toBeInTheDocument();

    await user.click(toggleButton);
    await user.click(toggleButton);
  });

  test('render user menu with settings and sign out options', async () => {
    const user = userEvent.setup();

    render(AppBar);

    const menuButton = screen.getByRole('button', {
      name: 'Expandir menu de usuário',
    });
    expect(menuButton).toBeInTheDocument();

    await user.click(menuButton);

    await waitFor(() => {
      expect(screen.getByText('Configurações')).toBeInTheDocument();
      expect(screen.getByText('Sair')).toBeInTheDocument();
    });
  });
});
