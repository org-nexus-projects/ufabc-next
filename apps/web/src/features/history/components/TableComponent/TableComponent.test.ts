import { render, screen } from '@/test-utils';

import { TableComponent } from '.';

describe('<TableComponent />', () => {
  test('render a table with head and body', () => {
    render(TableComponent, {
      slots: {
        body: 'body',
        head: 'head',
      },
    });
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText(/body/iu)).toBeInTheDocument();
    expect(screen.getByText(/head/iu)).toBeInTheDocument();
  });
});
