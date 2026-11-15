import { http, HttpResponse } from 'msw';

import { comments } from '@/mocks/reviews';
import { server } from '@/mocks/server';
import { render, screen, userEvent, waitFor } from '@/test-utils';

import { SingleComment } from '.';

describe('<SingleComment />', () => {
  test('render Comment, give like and recommendation, them remove like and recomendation', async () => {
    server.use(
      http.post(`*/reactions/*`, () => HttpResponse.json(), {
        once: true,
      }),
      http.post(`*/reactions/*`, () => HttpResponse.json(), {
        once: true,
      })
    );
    render(SingleComment, {
      props: {
        comment: {
          ...comments.data[0],
          myReactions: {
            like: false,
            recommendation: false,
            star: false,
          },
          reactionsCount: {
            like: 50,
            recommendation: 150,
          },
        },
      },
    });
    expect(
      await screen.findByText(new RegExp(comments.data[0].comment, 'iu'))
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(comments.data[0].subject.name, 'iu'))
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /Deixar like/iu })
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Deixar recomendação/iu })
    );
    await waitFor(() => {
      expect(screen.getByText('51')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('151')).toBeInTheDocument();
    });
    await userEvent.click(
      screen.getByRole('button', { name: /Remover like/iu })
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Remover recomendação/iu })
    );
    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });
  test('render Comment, remove like and recommendation and show error toaster', async () => {
    server.use(
      http.delete(
        `*/reactions/*`,
        () =>
          HttpResponse.json(
            {
              error: 'Reaction remove like error',
              name: 'BadRequest',
              status: 400,
              type: 'BadRequest',
            },
            {
              status: 400,
            }
          ),
        {
          once: true,
        }
      ),
      http.delete(
        `*/reactions/*`,
        () =>
          HttpResponse.json(
            {
              error: 'Reaction remove recommendation error',
              name: 'BadRequest',
              status: 400,
              type: 'BadRequest',
            },
            {
              status: 400,
            }
          ),
        {
          once: true,
        }
      )
    );
    render(SingleComment, {
      props: {
        comment: {
          ...comments.data[0],
          myReactions: {
            like: true,
            recommendation: true,
            star: false,
          },
          reactionsCount: {
            like: 50,
            recommendation: 150,
          },
        },
      },
    });
    expect(
      await screen.findByText(new RegExp(comments.data[0].comment, 'iu'))
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(comments.data[0].subject.name, 'iu'))
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: /Remover like/iu })
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Remover recomendação/iu })
    );
    expect(
      await screen.findByText('Reaction remove like error')
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Reaction remove recommendation error')
    ).toBeInTheDocument();
  });
});
