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
  test('render user info in app bar dropdown', async () => {
    const user = userEvent.setup();

    render(AppBar);

    user.click(
      screen.getByRole('button', { name: 'Expandir menu de usuário' }),
    );
    expect(await screen.findByText(/sair/i)).toBeInTheDocument();
    expect(
      await screen.findByText(mockedUser.email.replace(/(.*)@.*/, '$1')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(`^${mockedUser.email[0]}${mockedUser.email[1]}$`, 'i'),
      ),
    ).toBeInTheDocument();
  });
  test('render user initials if user email has two names', async () => {
    authStore.user = {
      ...mockedUser,
      email: 'firstName.lastName@aluno.ufabc.edu.br',
    };
    const user = userEvent.setup();

    render(AppBar);

    user.click(
      screen.getByRole('button', { name: 'Expandir menu de usuário' }),
    );
    expect(await screen.findByText(/FL/)).toBeInTheDocument();
  });
  test('click on logout button to logout', async () => {
    const user = userEvent.setup();

    render(AppBar);

    user.click(
      screen.getByRole('button', { name: 'Expandir menu de usuário' }),
    );
    expect(authStore.token).not.toBeNull();
    expect(authStore.user).not.toBeNull();
    user.click(await screen.findByText(/sair/i));
    await waitFor(() => {
      expect(authStore.token).toBeNull();
      expect(authStore.user).toBeNull();
    });
  });
});
