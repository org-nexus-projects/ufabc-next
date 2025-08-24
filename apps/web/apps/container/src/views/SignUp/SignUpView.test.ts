import { http,HttpResponse } from 'msw';
import * as vuetify from 'vuetify';

import { server } from '@/mocks/server';
import { user as mockedUser } from '@/mocks/users';
import { useAuth } from '@/stores/useAuth';
import { render, screen, userEvent, waitFor } from '@/test-utils';

import { SignUpView } from '.';

describe('<SignUpView />', () => {
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
  test('render sign up page', () => {
    render(SignUpView, {
      global: {
        stubs: ['router-link'],
      },
    });
    expect(
      screen.getByText(/Usar outra conta do google\/facebook/i),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText(/Pessoa meditando na frente do computador/),
    ).toBeInTheDocument();
    expect(screen.getByText(/O que você faz na UFABC\?/)).toBeInTheDocument();
  });
  test('logout when click to change account', async () => {
    const user = await userEvent.setup();
    render(SignUpView, {
      global: {
        stubs: ['router-link'],
      },
    });
    expect(useAuth.getState().token).not.toBeNull();
    expect(useAuth.getState().user).not.toBeNull();
    await user.click(screen.getByText(/Usar outra conta do google\/facebook/i));
    await waitFor(() => {
      expect(useAuth.getState().token).toBeNull();
      expect(useAuth.getState().user).toBeNull();
    });
  });
  test('render sm and down screen', async () => {
    vi.spyOn(vuetify, 'useDisplay').mockImplementation(
      () =>
        ({
          smAndDown: true,
        }) as unknown as ReturnType<typeof vuetify.useDisplay>,
    );

    render(SignUpView, {
      global: {
        stubs: ['router-link'],
      },
    });

    expect(
      screen.getByAltText(/Pessoa meditando na frente do computador/),
    ).toBeInTheDocument();
    expect(screen.getByText(/O que você faz na UFABC\?/)).toBeInTheDocument();
  });
  test('fill form as teacher', async () => {
    const user = await userEvent.setup();
    render(SignUpView, {
      global: {
        stubs: ['router-link'],
      },
    });

    await user.click(screen.getByText(/Professor/i));

    expect(screen.getByText(/Estamos trabalhando nisso!/i)).toBeInTheDocument();
  });
  test('fill form as student', async () => {
    const user = await userEvent.setup();
    render(SignUpView, {
      global: {
        stubs: ['router-link'],
      },
    });

    await user.click(screen.getByText(/Aluno/));

    expect(
      screen.getByText(/Falta pouco para completar o seu cadastro/i),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole('textbox', { name: 'Insira seu email institucional' }),
      mockedUser.email.replace(/(.*)@.*/, '$1'),
    );

    await user.type(
      screen.getByRole('textbox', { name: 'Insira seu RA' }),
      String(mockedUser.ra),
    );

    await user.type(
      screen.getByRole('textbox', { name: 'Confirme seu RA' }),
      '123456789',
    );

    expect(
      await screen.findByText(/Os campos RA devem ser iguais/),
    ).toBeInTheDocument();
  });
  test('fill form as student', async () => {
    const user = await userEvent.setup();
    render(SignUpView, {
      global: {
        stubs: ['router-link'],
      },
    });

    await user.click(screen.getByText(/Aluno/));

    expect(
      screen.getByText(/Falta pouco para completar o seu cadastro/i),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole('textbox', { name: 'Insira seu email institucional' }),
      mockedUser.email.replace(/(.*)@.*/, '$1'),
    );

    await user.type(
      screen.getByRole('textbox', { name: 'Insira seu RA' }),
      String(mockedUser.ra),
    );

    await user.type(
      screen.getByRole('textbox', { name: 'Confirme seu RA' }),
      String(mockedUser.ra),
    );

    await user.click(screen.getByRole('checkbox'));

    expect(screen.getByText(/Enviar/i)).toBeEnabled();
    await user.click(screen.getByText(/Enviar/i));

    expect(
      await screen.findByText(/Enviamos um email de confirmação para/),
    ).toBeInTheDocument();

    expect(await screen.findByText(mockedUser.email)).toBeInTheDocument();

    await user.click(
      await screen.findByLabelText(/Reenviar email de confirmação/),
    );

    expect(
      await screen.findByText(/Email reenviado com sucesso/),
    ).toBeInTheDocument();
  });
  test('fill form as student but get error when submit form', async () => {
    server.use(
      http.put('*/users/complete', () =>
        HttpResponse.json({ error: 'Erro ao se cadastrar' }, { status: 500 }),
      ),
    );

    const user = await userEvent.setup();
    render(SignUpView, {
      global: {
        stubs: ['router-link'],
      },
    });

    await user.click(screen.getByText(/Aluno/));

    expect(
      screen.getByText(/Falta pouco para completar o seu cadastro/i),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole('textbox', { name: 'Insira seu email institucional' }),
      mockedUser.email.replace(/(.*)@.*/, '$1'),
    );

    await user.type(
      screen.getByRole('textbox', { name: 'Insira seu RA' }),
      String(mockedUser.ra),
    );

    await user.type(
      screen.getByRole('textbox', { name: 'Confirme seu RA' }),
      String(mockedUser.ra),
    );

    await user.click(screen.getByRole('checkbox'));

    expect(screen.getByText(/Enviar/i)).toBeEnabled();
    await user.click(screen.getByText(/Enviar/i));

    expect(await screen.findByText(/Erro ao se cadastrar/)).toBeInTheDocument();
  });
  test('fill form as student and get error to resend email', async () => {
    server.use(
      http.post('*/users/me/resend', () =>
        HttpResponse.json({ error: 'Erro ao reenviar email' }, { status: 500 }),
      ),
    );

    const user = await userEvent.setup();
    render(SignUpView, {
      global: {
        stubs: ['router-link'],
      },
    });

    await user.click(screen.getByText(/Aluno/));

    expect(
      screen.getByText(/Falta pouco para completar o seu cadastro/i),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole('textbox', { name: 'Insira seu email institucional' }),
      mockedUser.email.replace(/(.*)@.*/, '$1'),
    );

    await user.type(
      screen.getByRole('textbox', { name: 'Insira seu RA' }),
      String(mockedUser.ra),
    );

    await user.type(
      screen.getByRole('textbox', { name: 'Confirme seu RA' }),
      String(mockedUser.ra),
    );

    await user.click(screen.getByRole('checkbox'));

    expect(screen.getByText(/Enviar/i)).toBeEnabled();
    await user.click(screen.getByText(/Enviar/i));

    expect(
      await screen.findByText(/Enviamos um email de confirmação para/),
    ).toBeInTheDocument();

    expect(await screen.findByText(mockedUser.email)).toBeInTheDocument();

    await user.click(
      await screen.findByLabelText(/Reenviar email de confirmação/),
    );

    expect(
      await screen.findByText(/Erro ao reenviar email/),
    ).toBeInTheDocument();
  });
});
