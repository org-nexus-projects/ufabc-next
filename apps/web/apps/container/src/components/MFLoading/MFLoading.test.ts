import { render, screen } from '@/test-utils';
import { MFLoading } from '.';

describe('<MFLoading />', () => {
  test('render a loading', () => {
    render(MFLoading);
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument();
  });
});
