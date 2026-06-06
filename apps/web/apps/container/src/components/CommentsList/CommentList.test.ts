import { http, HttpResponse } from 'msw';

import { comments } from '@/mocks/reviews';
import { server } from '@/mocks/server';
import { render, screen } from '@/test-utils';

import { CommentsList } from '.';

describe('<CommentsList />', () => {
  test('render Comments List', async () => {
    render(CommentsList, {
      props: {
        teacherId: '111',
        selectedSubject: 'Todas as matérias',
      },
    });
    expect(
      await screen.findByText(RegExp(comments.data[0].comment, 'i')),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(RegExp(comments.data[0].subject.name, 'i'))[0],
    ).toBeInTheDocument();
    expect(
      screen.getByText(RegExp(comments.data[1].comment, 'i')),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(RegExp(comments.data[1].subject.name, 'i'))[0],
    ).toBeInTheDocument();
  });
  test('render empty Comments List', async () => {
    server.use(
      http.get(`*/comments/*`, () =>
        HttpResponse.json({
          data: [],
          total: 0,
        }),
      ),
    );
    render(CommentsList, {
      props: {
        teacherId: '111',
        selectedSubject: 'Todas as matérias',
      },
    });
    expect(
      await screen.findByText(
        /Infelizmente, nenhum comentário foi encontrado/i,
      ),
    ).toBeInTheDocument();
  });
  test('show toaster when Fetching Teacher Data Error', async () => {
    server.use(
      http.get(`*/reviews/teachers/*`, () =>
        HttpResponse.json(null, { status: 500 }),
      ),
    );

    render(CommentsList, {
      props: {
        teacherId: '111',
        selectedSubject: 'Todas as matérias',
      },
    });
    expect(
      await screen.findByText('Erro ao carregar o(a) professor(a)'),
    ).toBeInTheDocument();
  });
  test('show toaster when Fetching Comments Error', async () => {
    server.use(
      http.get(`*/comments/*`, () => HttpResponse.json(null, { status: 500 })),
    );
    render(CommentsList, {
      props: {
        teacherId: '111',
        selectedSubject: 'Todas as matérias',
      },
    });

    expect(
      await screen.findByText('Erro ao carregar comentários'),
    ).toBeInTheDocument();
  });
});
