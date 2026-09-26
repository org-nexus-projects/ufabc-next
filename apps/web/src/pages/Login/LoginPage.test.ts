import { http, HttpResponse } from 'msw';
import { createPinia, setActivePinia } from 'pinia';

import { createMockJwt } from '@/mocks/jwt';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/stores/auth';
import { render, screen, userEvent, waitFor } from '@/test-utils';
import * as runtimeConfig from '@/utils/runtimeConfig';

import { LoginPage } from '.';

const routerMock = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('vue-router', () => ({
  useRouter: () => routerMock,
}));

describe('<LoginPage />', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    routerMock.push.mockReset();
  });

  test('renders Google OAuth when using the production backend', () => {
    vi.spyOn(runtimeConfig, 'isDevelopmentApiSession').mockReturnValue(false);

    render(LoginPage);

    expect(screen.getByAltText(/logo do UFABC Next/iu)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Entrar com Google/iu })
    ).toHaveAttribute(
      'href',
      'http://localhost:5000/login/google?requesterKey=ufabc-next'
    );
    expect(
      screen.queryByRole('button', { name: /Entrar no ambiente DEV/iu })
    ).not.toBeInTheDocument();
  });

  test('authenticates with a backoffice email when using the development backend', async () => {
    vi.spyOn(runtimeConfig, 'isDevelopmentApiSession').mockReturnValue(true);
    const token = createMockJwt({
      _id: 'user-id',
      confirmed: true,
      email: 'dev@example.com',
      permissions: [],
    });

    server.use(
      http.post(
        `${runtimeConfig.runtimeConfig.apiBaseUrl}/backoffice/token`,
        async ({ request }) => {
          expect(await request.json()).toEqual({ email: 'dev@example.com' });
          return HttpResponse.json({ token });
        }
      )
    );

    render(LoginPage);
    const user = userEvent.setup();

    expect(
      screen.queryByRole('link', { name: /Entrar com Google/iu })
    ).not.toBeInTheDocument();
    await user.type(
      screen.getByRole('textbox', { name: /E-mail do backoffice/iu }),
      '  DEV@example.com  '
    );
    await user.click(
      screen.getByRole('button', { name: /Entrar no ambiente DEV/iu })
    );

    await waitFor(() => {
      expect(useAuthStore().token).toBe(token);
      expect(routerMock.push).toHaveBeenCalledWith('/');
    });
  });
});
