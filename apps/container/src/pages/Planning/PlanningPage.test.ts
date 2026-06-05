import { render, screen } from '@/test-utils';

import { PlanningPage } from '.';

describe('<PlanningPage />', () => {
  test('render admin view', () => {
    render(PlanningPage);
    expect(
      screen.getByRole('heading', { name: 'Planning' }),
    ).toBeInTheDocument();
  });
});
