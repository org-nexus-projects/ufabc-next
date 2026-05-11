import { render, screen } from '@/test-utils';

import { LoginView } from '.';

describe('<LoginView />', () => {
  test('renders the local login entry with google oauth link', () => {
    render(LoginView, {
      global: {
        stubs: ['router-link'],
      },
    });

    expect(screen.getByAltText(/logo do UFABC Next/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /Bem-vindo\(a\)!/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Entrar com Google/i }),
    ).toHaveAttribute(
      'href',
      'http://localhost:5000/login/google?requesterKey=ufabc-next',
    );
    expect(
      document.querySelector('router-link-stub[to="/signup"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('router-link-stub[to="/recovery"]'),
    ).not.toBeNull();
  });
});
