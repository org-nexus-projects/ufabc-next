import { http, HttpResponse } from 'msw';

import { comments } from '@/mocks/reviews';
import { server } from '@/mocks/server';
import { render, screen } from '@/test-utils';

import { CommentsList } from '.';

describe('<CommentsList />', () => {
  test('render Comments List', async () => {
    render(CommentsList, {
      props: {
        selectedSubject: 'Todas as matérias',
        teacherId: '111',
      },
    });
    expect(
      await screen.findByText(new RegExp(comments.data[0].comment, 'iu'))
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(new RegExp(comments.data[0].subject.name, 'iu'))[0]
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(comments.data[1].comment, 'iu'))
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(new RegExp(comments.data[1].subject.name, 'iu'))[0]
    ).toBeInTheDocument();
  });
  test('render empty Comments List', async () => {
    server.use(
      http.get(`*/comments/*`, () =>
        HttpResponse.json({
          data: [],
          total: 0,
        })
      )
    );
    render(CommentsList, {
      props: {
        selectedSubject: 'Todas as matérias',
        teacherId: '111',
      },
    });
    expect(
      await screen.findByText(
        /Infelizmente, nenhum comentário foi encontrado/iu
      )
    ).toBeInTheDocument();
  });
  test('show toaster when Fetching Comments Error', async () => {
    server.use(
      http.get(`*/comments/*`, () => HttpResponse.json(null, { status: 500 }))
    );
    render(CommentsList, {
      props: {
        selectedSubject: 'Todas as matérias',
        teacherId: '111',
      },
    });

    expect(
      await screen.findByText('Erro ao carregar comentários')
    ).toBeInTheDocument();
  });
});
