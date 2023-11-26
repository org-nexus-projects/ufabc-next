import { render, screen } from '@/test-utils';
import { ConceptsPieChart } from '.';
import { concepts } from '@/mocks/reviews';

const total = Object.values(concepts).reduce((acc, curr) => acc + curr, 0);

describe('<ConceptsPieChart />', () => {
  test('render Concepts Pie Highchart', async () => {
    render(ConceptsPieChart, {
      props: {
        grades: concepts,
      },
    });

    Object.values(concepts).forEach((concept) => {
      expect(
        screen.getByText(RegExp(((100 * concept) / total).toFixed(1), 'i')),
      ).toBeInTheDocument();
    });
  });
});
