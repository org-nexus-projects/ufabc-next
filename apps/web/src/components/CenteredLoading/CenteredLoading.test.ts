import { render, screen } from '@/test-utils';

import { CenteredLoading } from '.';

describe('<CenteredLoading />', () => {
  test('render a loading', () => {
    render(CenteredLoading);
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument();
  });
});
