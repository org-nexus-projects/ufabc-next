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
      }),
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
      await screen.findByText(RegExp(comments.data[0].comment, 'i')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(RegExp(comments.data[0].subject.name, 'i')),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Deixar like/i }));
    await userEvent.click(
      screen.getByRole('button', { name: /Deixar recomendação/i }),
    );
    await waitFor(() => {
      expect(screen.getByText('51')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('151')).toBeInTheDocument();
    });
    await userEvent.click(
      screen.getByRole('button', { name: /Remover like/i }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Remover recomendação/i }),
    );
    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });
  test('render Comment, give like and recommendation and show error toaster', async () => {
    server.use(
      http.post(
        `*/reactions/*`,
        () =>
          HttpResponse.json(
            {
              status: 400,
              name: 'BadRequest',
              type: 'BadRequest',
              error: 'Reaction like error',
            },
            {
              status: 400,
            },
          ),
        {
          once: true,
        },
      ),
      http.post(
        `*/reactions/*`,
        () =>
          HttpResponse.json(
            {
              status: 400,
              name: 'BadRequest',
              type: 'BadRequest',
              error: 'Reaction recommendation error',
            },
            {
              status: 400,
            },
          ),
        {
          once: true,
        },
      ),
    );
    render(SingleComment, {
      props: {
        comment: {
          ...comments.data[0],
          reactionsCount: {
            like: 50,
            recommendation: 150,
          },
        },
      },
    });
    expect(
      await screen.findByText(RegExp(comments.data[0].comment, 'i')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(RegExp(comments.data[0].subject.name, 'i')),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Deixar like/i }));
    await userEvent.click(
      screen.getByRole('button', { name: /Deixar recomendação/i }),
    );
    expect(await screen.findByText('Reaction like error')).toBeInTheDocument();
    expect(
      await screen.findByText('Reaction recommendation error'),
    ).toBeInTheDocument();
  });
  test('render Comment, remove like and recommendation and show error toaster', async () => {
    server.use(
      http.delete(
        `*/reactions/*`,
        () =>
          HttpResponse.json(
            {
              status: 400,
              name: 'BadRequest',
              type: 'BadRequest',
              error: 'Reaction remove like error',
            },
            {
              status: 400,
            },
          ),
        {
          once: true,
        },
      ),
      http.delete(
        `*/reactions/*`,
        () =>
          HttpResponse.json(
            {
              status: 400,
              name: 'BadRequest',
              type: 'BadRequest',
              error: 'Reaction remove recommendation error',
            },
            {
              status: 400,
            },
          ),
        {
          once: true,
        },
      ),
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
      await screen.findByText(RegExp(comments.data[0].comment, 'i')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(RegExp(comments.data[0].subject.name, 'i')),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: /Remover like/i }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Remover recomendação/i }),
    );
    expect(
      await screen.findByText('Reaction remove like error'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Reaction remove recommendation error'),
    ).toBeInTheDocument();
  });
});
