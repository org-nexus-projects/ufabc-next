import { render, screen } from '@/test-utils';

import { AdminPage } from '.';

describe('<AdminPage />', () => {
  test('render admin view', () => {
    render(AdminPage);
    expect(screen.getByRole('heading', { name: 'Admin' })).toBeInTheDocument();
  });
});
