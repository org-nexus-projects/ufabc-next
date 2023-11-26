import { render, screen } from '@/test-utils';
import { ConceptsHorizontalChart } from '.';
import { subjectInfo } from '@/mocks/reviews';

describe('<ConceptsHorizontalChart />', () => {
  test('render Concepts Horizontal Chart with regular found teacher', async () => {
    render(ConceptsHorizontalChart, {
      props: {
        gradeData: subjectInfo.specific[2],
      },
    });

    const tooltipTextPercentage = `${
      subjectInfo.specific[2].distribution[0].conceito
    }: ${(
      (100 * subjectInfo.specific[2].distribution[0].count) /
      subjectInfo.specific[2].count
    ).toFixed(1)}%`;

    const tooltipTextAmount = `${subjectInfo.specific[2].distribution[0].count} notas`;
    expect(
      await screen.findByText(RegExp(tooltipTextPercentage, 'i')),
    ).toBeInTheDocument();
    expect(
      await screen.getByText(RegExp(tooltipTextAmount, 'i')),
    ).toBeInTheDocument();
  });

  test('render Concepts Horizontal Chart with untrustable threshold ', async () => {
    render(ConceptsHorizontalChart, {
      props: {
        gradeData: subjectInfo.specific[1],
      },
    });
    expect(
      await screen.findByText('Dados sem muitas amostras'),
    ).toBeInTheDocument();
  });
});
