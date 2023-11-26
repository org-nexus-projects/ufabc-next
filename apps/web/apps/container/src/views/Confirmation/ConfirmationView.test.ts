import { render, screen } from '@/test-utils';
import { ConfirmationView } from '.';
import { useRouter } from 'vue-router';
import { server } from '@/mocks/server';
import { HttpResponse, http } from 'msw';

vi.mock('@/views/Calengrade', () => ({
  CalengradeView: () => 'CalengradeView',
}));

vi.mock('vue-router', async () => ({
  useRouter: vi.fn(),
  createRouter: vi.fn(() => ({
    beforeEach: vi.fn(),
  })),
  createWebHistory: vi.fn(),
}));

describe('<ConfirmationView />', () => {
  test('render confirmation view with error message when token is null', async () => {
    vi.mocked(useRouter).mockReturnValue({
      isReady: vi.fn(() => true),
      currentRoute: {
        value: {
          query: {},
        },
      },
      push: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    render(ConfirmationView);
    expect(
      await screen.findByText('Erro ao confirmar sua conta'),
    ).toBeInTheDocument();
  });
  test('show loading and success message when validating token', async () => {
    vi.mocked(useRouter).mockReturnValue({
      isReady: vi.fn(() => true),
      currentRoute: {
        value: {
          query: {
            token: 'token',
          },
        },
      },
      push: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    render(ConfirmationView);
    expect(
      await screen.findByText(
        'Estamos validando sua conta, aguarde um momento...',
      ),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Conta confirmada com sucesso'),
    ).toBeInTheDocument();
  });
  test('show error when validating and confirmation fails', async () => {
    const message = 'Ocorreu um erro';
    server.use(
      http.post(/.*\/account\/confirm/, () =>
        HttpResponse.json({ error: message }, { status: 500 }),
      ),
    );

    vi.mocked(useRouter).mockReturnValue({
      isReady: vi.fn(() => true),
      currentRoute: {
        value: {
          query: {
            token: 'token',
          },
        },
      },
      push: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    render(ConfirmationView);
    expect(await screen.findByText(message)).toBeInTheDocument();
  });
});
