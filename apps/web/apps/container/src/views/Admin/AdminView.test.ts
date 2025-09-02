import { render, screen } from '@/test-utils';

import { AdminView } from '.';

describe('<AdminView />', () => {
  test('render admin view', () => {
    render(AdminView);
    expect(
      screen.getByRole('heading', { name: 'Admin' }),
    ).toBeInTheDocument();
  });
});
