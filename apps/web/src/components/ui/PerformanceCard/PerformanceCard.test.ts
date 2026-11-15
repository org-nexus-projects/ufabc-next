import { render, screen } from '@/test-utils';

import { PerformanceCard } from '.';

describe('<PerformanceCard />', () => {
  test('render a performance card title, subtitle and description', () => {
    render(PerformanceCard, {
      props: {
        color: 'primary',
        description: 'description',
        icon: 'mdi-trophy-outline',
        subTitle: 'subtitle',
        title: 'title',
      },
    });
    expect(screen.getByText(/^title/iu)).toBeInTheDocument();
    expect(screen.getByText(/description/iu)).toBeInTheDocument();
    expect(screen.getByText(/subtitle/iu)).toBeInTheDocument();
  });
});
