import { render, screen } from '@/test-utils';

import { PaperCard } from '.';

describe('<PaperCard />', () => {
  test('render a paper card title', () => {
    render(PaperCard, { props: { title: 'title' } });
    expect(screen.getByText(/title/iu)).toBeInTheDocument();
  });
  test('render a paper card slot', () => {
    render(PaperCard, { slots: { default: 'slot' } });
    expect(screen.getByText(/slot/iu)).toBeInTheDocument();
  });
});
