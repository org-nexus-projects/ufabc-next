import { render, screen } from '@/test-utils';

import { PlanningView } from '.';

describe('<PlanningView />', () => {
  test('render admin view', () => {
    render(PlanningView);
    expect(
      screen.getByRole('heading', { name: 'Planning' }),
    ).toBeInTheDocument();
  });
});
