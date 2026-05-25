import { http, HttpResponse } from 'msw';
import { createPinia, setActivePinia } from 'pinia';

import { server } from '@/mocks/server';
import { user as mockedUser } from '@/mocks/users';
import { useAuthStore } from '@/stores/auth';
import {
  expectToasterToHaveText,
  render,
  screen,
  userEvent,
  waitFor,
} from '@/test-utils';

import { SettingsView } from '.';

describe('<SettingsView />', () => {
  let authStore: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    authStore.token = 'token';
    authStore.user = mockedUser;
  });

  afterEach(() => {
    authStore.logOut();
  });
  test('render settings loading when user info not loaded', () => {
    render(SettingsView);
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument();
  });
  test('render user info', async () => {
    render(SettingsView);
    expect(
      await screen.findByText(mockedUser.email.replace(/(.*)@.*/, '$1')),
    ).toBeInTheDocument();
    expect(await screen.findByText(mockedUser.email)).toBeInTheDocument();
    expect(
      await screen.findByText(
        `Usuário desde ${new Date(mockedUser.createdAt).toLocaleDateString(
          'pt-BR',
          {
            timeZone: 'UTC',
          },
        )}`,
      ),
    ).toBeInTheDocument();
  });
  test('render user without associated accounts', async () => {
    server.use(
      http.get(/.*\/users\/info/, () =>
        HttpResponse.json({
          ...mockedUser,
          oauth: {
            email: mockedUser.email,
          },
        }),
      ),
    );
    render(SettingsView);
    const googleLink = await screen.findByRole('link', {
      name: 'Associar à uma conta do Google',
    });

    expect(googleLink).toBeInTheDocument();
    expect(googleLink).toHaveAttribute(
      'href',
      `http://localhost:5000/login/google?userId=${mockedUser._id}`,
    );
  });
  test('deactivate user', async () => {
    const user = userEvent.setup();

    render(SettingsView);

    await user.click(await screen.findByText('Desativar Conta'));
    expect(await screen.findAllByText('Excluir conta')).toHaveLength(2);

    expect(authStore.token).not.toBeNull();
    expect(authStore.user).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Excluir conta' }));
    await waitFor(() => {
      expect(authStore.token).toBeNull();
      expect(authStore.user).toBeNull();
    });
  });
  test('show toast if error when deactivate user', async () => {
    server.use(
      http.delete(/.*\/users\/remove/, () => HttpResponse.error()),
    );

    const user = userEvent.setup();

    render(SettingsView);

    await user.click(await screen.findByText('Desativar Conta'));
    expect(await screen.findAllByText('Excluir conta')).toHaveLength(2);

    expect(authStore.token).not.toBeNull();
    expect(authStore.user).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Excluir conta' }));

    await expectToasterToHaveText(
      'Ocorreu um erro ao tentar excluir sua conta',
    );
    expect(authStore.token).not.toBeNull();
    expect(authStore.user).not.toBeNull();
  });
});
