import { createPinia, setActivePinia } from 'pinia';
import { useRouter } from 'vue-router';

import { user as mockedUser } from '@/mocks/users';
import { useAuthStore } from '@/stores/auth';
import { render, screen, userEvent, waitFor } from '@/test-utils';

import { UserMenu } from '.';

vi.mock('vue-router', async () => ({
  useRouter: vi.fn(),
  createRouter: vi.fn(() => ({
    beforeEach: vi.fn(),
  })),
  createWebHistory: vi.fn(),
}));

const pushMock = vi.fn();

describe('<UserMenu />', () => {
  let authStore: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    authStore.authenticate('mock-token');
    authStore.user = mockedUser;

    vi.mocked(useRouter).mockReturnValue({
      go: vi.fn(),
      push: pushMock,
      replace: vi.fn(),
      currentRoute: {
        value: {
          query: {},
        },
      },
    } as unknown as ReturnType<typeof useRouter>);
  });

  afterEach(() => {
    authStore.logOut();
    vi.clearAllMocks();
  });

  test('exibe informações do usuário no ativador do menu', () => {
    render(UserMenu);

    const userCleanUsername = mockedUser.email.replace('@aluno.ufabc.edu.br', '');
    expect(screen.getByText(userCleanUsername)).toBeInTheDocument();
  });

  test('exibe iniciais do usuário no avatar do ativador', () => {
    render(UserMenu);

    const userLogin = mockedUser.email
      ?.replace('@aluno.ufabc.edu.br', '')
      .toUpperCase();
    const expectedInitials = userLogin?.split('.').length === 1
      ? `${userLogin[0]}${userLogin[1]}`
      : `${userLogin?.[0]}${userLogin?.split('.')[1][0]}`;

    const avatars = screen.getAllByText(expectedInitials);
    expect(avatars.length).toBeGreaterThan(0);
  });

  test('abre o menu quando o ativador é clicado', async () => {
    const user = userEvent.setup();
    render(UserMenu);

    const activator = screen.getByText(
      mockedUser.email.replace('@aluno.ufabc.edu.br', ''),
    ).closest('div');

    expect(activator).toBeInTheDocument();
    await user.click(activator!);

    await waitFor(() => {
      expect(screen.getByText('Configurações')).toBeInTheDocument();
      expect(screen.getByText('Sair')).toBeInTheDocument();
    });
  });

  test('exibe informações completas do usuário no menu aberto', async () => {
    const user = userEvent.setup();
    render(UserMenu);

    const activator = screen.getByText(
      mockedUser.email.replace('@aluno.ufabc.edu.br', ''),
    ).closest('div');

    await user.click(activator!);

    await waitFor(() => {
      expect(screen.getByText(`RA: ${mockedUser.ra}`)).toBeInTheDocument();
    });
  });

  test('navega para página de configurações ao clicar em Configurações', async () => {
    const user = userEvent.setup();
    render(UserMenu);

    const activator = screen.getByText(
      mockedUser.email.replace('@aluno.ufabc.edu.br', ''),
    ).closest('div');

    await user.click(activator!);

    await waitFor(() => {
      expect(screen.getByText('Configurações')).toBeInTheDocument();
    });

    const settingsButton = screen.getByText('Configurações');
    await user.click(settingsButton);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/settings');
    });
  });

  test('emite evento logout ao clicar em Sair', async () => {
    const user = userEvent.setup();
    let logoutEmitted = false;

    render(UserMenu, {
      global: {
        listeners: {
          logout: () => {
            logoutEmitted = true;
          },
        },
      },
    });

    const activator = screen.getByText(
      mockedUser.email.replace('@aluno.ufabc.edu.br', ''),
    ).closest('div');

    await user.click(activator!);

    await waitFor(() => {
      expect(screen.getByText('Sair')).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Sair');
    await user.click(logoutButton);

    await waitFor(() => {
      expect(logoutEmitted).toBe(true);
    });
  });

  test('fecha o menu após clicar em Configurações', async () => {
    const user = userEvent.setup();
    render(UserMenu);

    const activator = screen.getByText(
      mockedUser.email.replace('@aluno.ufabc.edu.br', ''),
    ).closest('div');

    await user.click(activator!);

    await waitFor(() => {
      expect(screen.getByText('Configurações')).toBeInTheDocument();
    });

    const settingsButton = screen.getByText('Configurações');
    await user.click(settingsButton);

    await waitFor(() => {
      expect(screen.queryByText('Configurações')).not.toBeVisible();
    });
  });

  test('fecha o menu após clicar em Sair', async () => {
    const user = userEvent.setup();
    let logoutEmitted = false;

    render(UserMenu, {
      global: {
        listeners: {
          logout: () => {
            logoutEmitted = true;
          },
        },
      },
    });

    const activator = screen.getByText(
      mockedUser.email.replace('@aluno.ufabc.edu.br', ''),
    ).closest('div');

    await user.click(activator!);

    await waitFor(() => {
      expect(screen.getByText('Sair')).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Sair');
    await user.click(logoutButton);

    await waitFor(() => {
      expect(logoutEmitted).toBe(true);
      expect(screen.queryByText('Sair')).not.toBeVisible();
    });
  });

  test('exibe RA do usuário no formato correto', async () => {
    const user = userEvent.setup();
    render(UserMenu);

    const activator = screen.getByText(
      mockedUser.email.replace('@aluno.ufabc.edu.br', ''),
    ).closest('div');

    await user.click(activator!);

    await waitFor(() => {
      const raText = screen.getByText(`RA: ${mockedUser.ra}`);
      expect(raText).toBeInTheDocument();
    });
  });
});
