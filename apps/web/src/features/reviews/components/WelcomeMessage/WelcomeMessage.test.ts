import { render, screen } from '@/test-utils';

import { WelcomeMessage } from '.';

describe('<WelcomeMessage />', () => {
  test('render welcome messages and next benefits', () => {
    render(WelcomeMessage);
    expect(
      screen.getByText('Como funciona o UFABC Next e os Reviews?')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Centralização da informação/iu)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Informações anônimas e segurança de dados/iu)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Interface responsiva, acesse pelo celular/iu)
    ).toBeInTheDocument();
  });
});
