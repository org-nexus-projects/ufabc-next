import { render, screen, userEvent, waitFor } from '@/test-utils';
import { AppBar } from '.';
import { user as mockedUser } from '@/mocks/users';
import { useAuth } from '@/stores/useAuth';

describe('<AppBar />', () => {
  const originalUseAuthValue = useAuth.getState();
  beforeEach(() => {
    useAuth.setState({
      ...originalUseAuthValue,
      token: 'token',
      user: mockedUser,
    });
  });
  afterEach(() => {
    useAuth.setState(originalUseAuthValue);
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
    useAuth.setState({
      user: {
        ...mockedUser,
        email: 'firstName.lastName@aluno.ufabc.edu.br',
      },
    });
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
    expect(useAuth.getState().token).not.toBeNull();
    expect(useAuth.getState().user).not.toBeNull();
    user.click(await screen.findByText(/sair/i));
    await waitFor(() => {
      expect(useAuth.getState().token).toBeNull();
      expect(useAuth.getState().user).toBeNull();
    });
  });
  test('not show app bar if props is false', async () => {
    render(AppBar, {
      props: {
        showAppBar: false,
      },
      slots: {
        default: 'slot',
      },
    });

    expect(screen.queryByText('slot')).toBeInTheDocument();

    expect(
      screen.queryAllByRole('img', { name: 'logo do UFABC Next' }),
    ).toHaveLength(0);
    expect(screen.queryByText('Reviews')).not.toBeInTheDocument();
    expect(screen.queryByText('Performance')).not.toBeInTheDocument();
    expect(screen.queryByText('Snapshot da Matrícula')).not.toBeInTheDocument();
    expect(screen.queryByText('Grupos no WhatsApp')).not.toBeInTheDocument();
  });
});
