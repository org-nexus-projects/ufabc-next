import {
  classes,
  classesPage1,
  courseNames,
  courses,
  overview,
  subjects,
  usage,
} from '@/mocks/stats';
import { render, screen, userEvent } from '@/test-utils';
import { getSeason, prettifySeason } from '@/utils/season';

import { StatsView } from '.';

describe('<StatsView />', () => {
  test('render loading', () => {
    render(StatsView);
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument();
  });
  test('render overview info', async () => {
    render(StatsView);
    expect(
      await screen.findByText('Alunos usando a extensão'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Turmas')).toHaveLength(2);
    expect(screen.getByText('Professores')).toBeInTheDocument();
    expect(screen.getByText('Vagas que sobraram')).toBeInTheDocument();
    expect(screen.getByText(usage.currentAlunos)).toBeInTheDocument();
    expect(screen.getByText('/' + usage.totalAlunos)).toBeInTheDocument();
    expect(screen.getByText(usage.subjects)).toBeInTheDocument();
    expect(screen.getByText(usage.teachers)).toBeInTheDocument();
    expect(screen.getByText(-overview.data[0].deficit)).toBeInTheDocument();
  });
  test('render classes table', async () => {
    render(StatsView);
    expect(
      await screen.findByText(
        'Introdução às Equações Diferenciais Ordinárias B2-Noturno',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText(classes.data[0].vagas).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText(classes.data[0].requisicoes).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(classes.data[0].deficit).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText(classes.data[0].ratio.toFixed(2)).length,
    ).toBeGreaterThan(0);
  });
  test('render classes table load more', async () => {
    const user = userEvent.setup();

    render(StatsView);
    expect(
      await screen.findByText(
        'Introdução às Equações Diferenciais Ordinárias B2-Noturno',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText(classes.data[0].vagas).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText(classes.data[0].requisicoes).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(classes.data[0].deficit).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText(classes.data[0].ratio.toFixed(2)).length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Carregar mais' }));

    expect(
      await screen.findByText('Organização do Trabalho A1-Noturno'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(classesPage1.data[0].vagas).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(classesPage1.data[0].requisicoes).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(classesPage1.data[0].deficit).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(classesPage1.data[0].ratio.toFixed(2)).length,
    ).toBeGreaterThan(0);
  });
  test('render courses table', async () => {
    const user = userEvent.setup();

    render(StatsView);
    expect(
      (await screen.findAllByText(classes.data[0].vagas)).length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByText('Cursos'));

    expect(await screen.findByText(courseNames[0].name)).toBeInTheDocument();
    expect(screen.getAllByText(courses.data[0].vagas).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText(courses.data[0].requisicoes).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(courses.data[0].deficit).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText(courses.data[0].ratio.toFixed(2)).length,
    ).toBeGreaterThan(0);
  });
  test('render subjects table', async () => {
    const user = userEvent.setup();

    render(StatsView);
    expect(
      (await screen.findAllByText(classes.data[0].vagas)).length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByText('Disciplinas'));

    expect(
      await screen.findByText('Funções de Uma Variável'),
    ).toBeInTheDocument();
    expect(screen.getAllByText(subjects.data[0].vagas).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText(subjects.data[0].requisicoes).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(subjects.data[0].deficit).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(subjects.data[0].ratio.toFixed(2)).length,
    ).toBeGreaterThan(0);
  });
  test('change order by', async () => {
    const user = userEvent.setup();

    render(StatsView);
    expect(
      (await screen.findAllByText(classes.data[0].vagas)).length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByText('Ordenar por:'));
    await user.click(screen.getAllByText('Pessoas por vaga')[0]);
    expect(screen.getAllByText('Pessoas por vaga')).toHaveLength(3);
    await user.click(screen.getByText('Ordenar por:'));
    await user.click(screen.getAllByText('Vagas')[0]);
    expect(screen.getAllByText('Vagas')).toHaveLength(3);
    await user.click(screen.getByText('Ordenar por:'));
    await user.click(screen.getAllByText('Requisições')[0]);
    expect(screen.getAllByText('Requisições')).toHaveLength(3);
    await user.click(screen.getByText('Ordenar por:'));
    await user.click(screen.getAllByText('Deficit')[0]);
    expect(screen.getAllByText('Deficit')).toHaveLength(3);
  });
  test('change season by', async () => {
    const user = userEvent.setup();

    render(StatsView);
    expect(
      (await screen.findAllByText(classes.data[0].vagas)).length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByText(prettifySeason(getSeason())));

    await user.click(screen.getByText(prettifySeason('2020:1')));

    expect(
      screen.getAllByText(prettifySeason('2020:1')).length,
    ).toBeGreaterThan(0);
  });
  test('change period', async () => {
    const user = userEvent.setup();

    render(StatsView);
    expect(
      (await screen.findAllByText(classes.data[0].vagas)).length,
    ).toBeGreaterThan(0);

    expect(screen.getByRole('checkbox', { name: 'Matutino' })).toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'Matutino' }));

    expect(
      screen.getByRole('checkbox', { name: 'Matutino' }),
    ).not.toBeChecked();
  });
});
