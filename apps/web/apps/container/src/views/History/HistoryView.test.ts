import { http, HttpResponse } from 'msw';

import { enrollments } from '@/mocks/enrollments';
import { server } from '@/mocks/server';
import { render, screen, userEvent } from '@/test-utils';

import { HistoryView } from '.';

describe('<CenteredLoading />', () => {
  test('show subjects table', async () => {
    render(HistoryView);
    expect(
      await screen.findByText(enrollments[0].disciplina),
    ).toBeInTheDocument();
    expect(screen.getByText(/disciplinas cursadas/i)).toBeInTheDocument();
  });
  test('show install extension warning if 0 enrollments', async () => {
    server.use(http.get(`*/enrollments`, () => HttpResponse.json([])));
    render(HistoryView);
    expect(
      await screen.findByText(/É necessário instalar a/i),
    ).toBeInTheDocument();
  });
  test('show install extension warning if only 1 enrollment', async () => {
    server.use(
      http.get(`*/enrollments`, () => HttpResponse.json([enrollments[0]])),
    );
    render(HistoryView);
    expect(await screen.findByText(/disciplina cursada/i)).toBeInTheDocument();
  });
  test('show alert error if 5xx request happens', async () => {
    server.use(
      http.get(`*/users/info`, () => HttpResponse.json(null, { status: 500 })),
    );
    render(HistoryView);
    expect(
      await screen.findByText(enrollments[0].disciplina),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        /Não foi possível buscar as informações, tente novamente mais tarde/i,
      ),
    ).toBeInTheDocument();
  });
  test('open extension dialog when click on extension button then close it', async () => {
    const user = userEvent.setup();

    render(HistoryView);

    await user.click(await screen.findByLabelText(/Atualizar o histórico/));

    expect(screen.getByText(/Já tenho instalado/i)).toBeVisible();

    await user.click(screen.getByText(/Já tenho instalado/i));

    expect(screen.getByText(/Já tenho instalado/i)).not.toBeVisible();
  });
});
