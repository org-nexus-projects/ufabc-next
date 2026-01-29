import { ElMessage } from 'element-plus';
import { http, HttpResponse } from 'msw';

import { enrollment } from '@/mocks/enrollments';
import { userCreateComment, userUpdateComment } from '@/mocks/reviews';
import { server } from '@/mocks/server';
import {
  expectToasterToHaveText,
  render,
  screen,
  userEvent,
  waitFor,
} from '@/test-utils';
import { formatSeason } from '@/utils/season';

import { ReviewDialog } from '.';

const commentAreaPlaceholder =
  'Faça aqui um comentário em relação ao docente e sua disciplina.';

describe('<ReviewDialog />', () => {
  beforeEach(() => {
    vitest.resetAllMocks();
    server.resetHandlers();
    ElMessage('');
  });

  test.each([
    { tagName: 'teoria', subjectType: 'teoria' },
    { tagName: 'prática', subjectType: 'pratica' },
  ])(
    'render Review Dialog and be able to comment (%s)%#',
    async ({ tagName, subjectType }) => {
      server.use(
        http.get(`*/enrollments/*`, () => {
          return HttpResponse.json({
            ...enrollment,
            comments: [],
            teoria: {},
            pratica: {},
            [subjectType]: {
              ...enrollment[subjectType as 'teoria' | 'pratica'],
              comment: undefined,
            },
          });
        }),
      );
      render(ReviewDialog, {
        props: {
          enrollment: enrollment,
          showDialog: true,
          tags: [
            tagName,
            formatSeason(enrollment.year + ':' + enrollment.quad),
          ],
        },
      });
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(await screen.findByText(tagName)).toBeInTheDocument();
      await userEvent.type(
        screen.getByPlaceholderText(commentAreaPlaceholder),
        userCreateComment.comment,
      );
      await userEvent.click(screen.getByRole('button', { name: /Enviar/i }));
      await expectToasterToHaveText('Comentário enviado com sucesso');
    },
  );
  test.each([
    { tagName: 'teoria', commentAvaliable: ['teoria'] },
    { tagName: 'prática', commentAvaliable: ['pratica'] },
    { tagName: 'teoria e prática', commentAvaliable: ['teoria', 'pratica'] },
  ])(
    'render Review Dialog with user comment and be able to edit comment %s %#',
    async ({ tagName, commentAvaliable }) => {
      server.use(
        http.get(`*/enrollments/*`, () => {
          return HttpResponse.json({
            ...enrollment,
            comments: commentAvaliable,
            teoria: {},
            pratica: {},
            [commentAvaliable[0]]: {
              ...enrollment[commentAvaliable[0] as 'teoria' | 'pratica'],
              comment: {
                ...enrollment[commentAvaliable[0] as 'teoria' | 'pratica']
                  ?.comment,
                comment: userCreateComment.comment,
              },
            },
          });
        }),
      );

      render(ReviewDialog, {
        props: {
          enrollment: enrollment,
          showDialog: true,
          tags: [
            tagName,
            formatSeason(enrollment.year + ':' + enrollment.quad),
          ],
        },
      });
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      await waitFor(() =>
        expect(
          screen.getByPlaceholderText(commentAreaPlaceholder),
        ).toHaveProperty('value', userCreateComment.comment),
      );

      await userEvent.clear(
        screen.getByPlaceholderText(commentAreaPlaceholder),
      );
      await userEvent.type(
        screen.getByPlaceholderText(commentAreaPlaceholder),
        userUpdateComment.comment,
      );
      await userEvent.click(
        screen.getByRole('button', { name: /Atualizar comentário/i }),
      );

      await expectToasterToHaveText('Comentário editado com sucesso');
    },
  );
  test.each([
    { tagName: 'teoria', commentAvaliable: ['teoria'] },
    { tagName: 'prática', commentAvaliable: ['pratica'] },
    { tagName: 'teoria e prática', commentAvaliable: ['teoria', 'pratica'] },
  ])(
    'render Review Dialog with theorical subject type and missing atributes %s %#',
    async ({ tagName, commentAvaliable }) => {
      render(ReviewDialog, {
        props: {
          enrollment: {
            ...enrollment,
            _id: '31312312313',
            teoria: {
              _id: 'teoria-id',
              name: 'Teoria',
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              __v: 0,
              comment: {
                _id: 'comment-id',
                comment: userCreateComment.comment,
                createdAt: new Date().toISOString(),
                enrollment: enrollment._id,
                reactionsCount: { like: 0, recommendation: 0 },
                subject: 'subject-id',
                teacher: 'teacher-id',
                updatedAt: new Date().toISOString(),
                viewers: 20,
                type: 'teoria',
                ra: '123456789',
                active: true,
                __v: 0,
              },
            },
            pratica: {
              _id: 'pratica-id',
              name: 'Prática',
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              __v: 0,
            },
            ...commentAvaliable.reduce(
              (acc, comment) => ({
                ...acc,
                [comment]: {
                  ...enrollment[comment as 'teoria' | 'pratica'],
                  _id: undefined,
                  name: undefined,
                },
              }),
              {},
            ),
          },
          showDialog: true,
          tags: [tagName],
        },
      });

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(tagName)).toBeInTheDocument();
      await expectToasterToHaveText(
        'Erro ao carregar as informações do professor desta disciplina',
      );
    },
  );
  test('show error alert when fetching Teacher Enrollment Error', async () => {
    server.use(
      http.get(`*/enrollments/*`, () =>
        HttpResponse.json(null, { status: 500 }),
      ),
    );
    render(ReviewDialog, {
      props: {
        enrollment: enrollment,
        showDialog: true,
        tags: [],
      },
    });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await expectToasterToHaveText(
      'Erro ao carregar as informações do professor desta disciplina',
    );
  });
  test('show error alert when create comment error', async () => {
    server.use(
      http.get(`*/enrollments/*`, () => {
        return HttpResponse.json({
          ...enrollment,
          comments: [],
          teoria: {},
          pratica: {},
        });
      }),
      http.post(`*/comments/*`, () => HttpResponse.json(null, { status: 500 })),
    );
    render(ReviewDialog, {
      props: {
        enrollment: enrollment,
        showDialog: true,
        tags: ['teoria', formatSeason(enrollment.year + ':' + enrollment.quad)],
      },
    });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText('teoria')).toBeInTheDocument();
    await userEvent.type(
      screen.getByPlaceholderText(commentAreaPlaceholder),
      userCreateComment.comment,
    );
    await userEvent.click(screen.getByRole('button', { name: /Enviar/i }));
    await expectToasterToHaveText('Ocorreu um erro ao enviar o comentário');
  });
  test('show error alert when update comment error', async () => {
    server.use(
      http.put(`*/comments/*`, () => HttpResponse.json(null, { status: 500 })),
      http.get(`*/enrollments/*`, () => {
        return HttpResponse.json({
          ...enrollment,
          comments: ['teoria'],

          pratica: {},
          teoria: {
            ...enrollment.teoria,
            comment: {
              ...enrollment.teoria?.comment,
              comment: userCreateComment.comment,
            },
          },
        });
      }),
    );
    render(ReviewDialog, {
      props: {
        enrollment: enrollment,
        showDialog: true,
        tags: ['teoria', formatSeason(enrollment.year + ':' + enrollment.quad)],
      },
    });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText(commentAreaPlaceholder),
      ).toHaveProperty('value', userCreateComment.comment),
    );

    await userEvent.clear(screen.getByPlaceholderText(commentAreaPlaceholder));
    await userEvent.type(
      screen.getByPlaceholderText(commentAreaPlaceholder),
      userUpdateComment.comment,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Atualizar comentário/i }),
    );

    await expectToasterToHaveText('Ocorreu um erro ao editar o comentário');
  });
  test('not render Dialog if props is false', async () => {
    render(ReviewDialog, {
      props: {
        enrollment: enrollment,
        showDialog: false,
        tags: ['teoria', formatSeason(enrollment.year + ':' + enrollment.quad)],
      },
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
