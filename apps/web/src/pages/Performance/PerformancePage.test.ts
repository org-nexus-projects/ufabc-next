import { render, screen } from '@/test-utils';

import { PerformancePage } from '.';

describe('<PerformancePage />', () => {
  test('render loading', () => {
    render(PerformancePage);
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument();
  });
});
