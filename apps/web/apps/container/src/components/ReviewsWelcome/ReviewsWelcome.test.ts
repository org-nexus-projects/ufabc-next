import { render, screen } from '@/test-utils';

import { ReviewsWelcome } from '.';

describe('<ReviewsWelcome />', () => {
  test('render Reviews Welcome', () => {
    render(ReviewsWelcome);
    expect(
      screen.getByRole('img', { name: /Animação de review/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /coletando informações públicas como turmas de uma disciplinas e unimos com as informações fornecidas pelos usuários./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Todos nossos dados de comentários e conceitos estão armazenados em nuvem e estão criptografados./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Interface responsiva, acesse pelo celular/i),
    ).toBeInTheDocument();
  });
});
