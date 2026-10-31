import { createPinia, setActivePinia } from 'pinia';
import * as vuetify from 'vuetify';

import { createMockJwt } from '@/mocks/jwt';
import { user as mockedUser } from '@/mocks/users';
import { useAuthStore } from '@/stores/auth';
import { render, screen, userEvent } from '@/test-utils';

import { SignUpPage } from '.';

describe('<SignUpPage />', () => {
  let authStore: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    authStore.authenticate(createMockJwt(mockedUser));
  });

  afterEach(() => {
    authStore.logOut();
  });
  test('render sm and down screen', async () => {
    vi.spyOn(vuetify, 'useDisplay').mockImplementation(
      () =>
        ({
          smAndDown: true,
        }) as unknown as ReturnType<typeof vuetify.useDisplay>
    );

    render(SignUpPage, {
      global: {
        stubs: ['router-link'],
      },
    });

    expect(
      screen.getByAltText(/Pessoa meditando na frente do computador/)
    ).toBeInTheDocument();
    expect(screen.getByText(/O que você faz na UFABC\?/)).toBeInTheDocument();
  });
  test('fill form as teacher', async () => {
    const user = await userEvent.setup();
    render(SignUpPage, {
      global: {
        stubs: ['router-link'],
      },
    });

    await user.click(screen.getByText(/Professor/i));

    expect(screen.getByText(/Estamos trabalhando nisso!/i)).toBeInTheDocument();
  });
});
