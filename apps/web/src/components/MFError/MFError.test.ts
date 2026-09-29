import { render, screen } from '@/test-utils';

import { MFError } from '.';

describe('<MFError />', () => {
  test('render error text', () => {
    render(MFError);
    expect(
      screen.getByText('Ocorreu um erro ao carregar, tente novamente'),
    ).toBeInTheDocument();
  });
});
