import { render, screen, userEvent } from '@/test-utils';
import { RecoveryView } from '.';
import { useRouter } from 'vue-router';
import { user as mockedUser } from '@/mocks/users';
import { HttpResponse, http } from 'msw';
import { server } from '@/mocks/server';

vi.mock('vue-router', async () => ({
  useRouter: vi.fn(),
  createRouter: vi.fn(() => ({
    beforeEach: vi.fn(),
  })),
  createWebHistory: vi.fn(),
}));

describe('<RecoveryView />', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      go: vi.fn(),
      push: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
  });

  test('render recovery', () => {
    render(RecoveryView);
    expect(screen.getByAltText(/logo do UFABC Next/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Imagem minimalista de dois estudantes/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Insira seu email institucional/i })).toBeInTheDocument();
  });
  test('click go back button', async () => {
    const user = await userEvent.setup();
    render(RecoveryView);

    await user.click(screen.getByRole('button', { name: /Anterior/i }));

    expect(useRouter().go).toHaveBeenCalledWith(-1);
  });
  test('should submit recovery form', async () => {
    const user = await userEvent.setup();
    render(RecoveryView);

    await user.type(
      screen.getByRole('textbox', { name: /Insira seu email institucional/i }),
      mockedUser.email,
    );

    await user.click(screen.getByRole('button', { name: /Próximo/i }));

    expect(
      await screen.findByText(/Sua conta será recuperada.*/i),
    ).toBeInTheDocument();

    await user.click(await screen.findByText('Voltar para a home'));

    expect(window.location.pathname).toBe('/');
  });
  test('should submit and show error', async () => {
    server.use(
      http.post(`*/users/me/recover`, () =>
        HttpResponse.json({ error: 'error' }, { status: 500 }),
      ),
    );

    const user = await userEvent.setup();
    render(RecoveryView);

    await user.type(
      screen.getByRole('textbox', { name: /Insira seu email institucional/i }),
      mockedUser.email,
    );

    await user.click(screen.getByRole('button', { name: /Próximo/i }));

    expect(
      await screen.findByText(/Não foi possível recuperar sua conta.*/i),
    ).toBeInTheDocument();
  });
});
