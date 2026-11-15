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
    { subjectType: 'teoria', tagName: 'teoria' },
    { subjectType: 'pratica', tagName: 'prática' },
  ])(
    'render Review Dialog and be able to comment (%s)%#',
    async ({ tagName, subjectType }) => {
      const subject = {
        ...enrollment[subjectType as 'teoria' | 'pratica'],
        comment: undefined,
      };
      server.use(
        http.get(`*/enrollments/*`, () =>
          HttpResponse.json({
            ...enrollment,
            comments: [],
            pratica: subjectType === 'pratica' ? subject : null,
            teoria: subjectType === 'teoria' ? subject : null,
          })
        )
      );
      render(ReviewDialog, {
        props: {
          enrollment,
          showDialog: true,
          tags: [
            tagName,
            formatSeason(`${enrollment.year}:${enrollment.quad}`),
          ],
        },
      });
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(await screen.findByText(tagName)).toBeInTheDocument();
      await userEvent.type(
        screen.getByPlaceholderText(commentAreaPlaceholder),
        userCreateComment.comment
      );
      await userEvent.click(screen.getByRole('button', { name: /Enviar/iu }));
      await expectToasterToHaveText('Comentário enviado com sucesso');
    }
  );
  test.each([
    { commentAvaliable: ['teoria'], tagName: 'teoria' },
    { commentAvaliable: ['pratica'], tagName: 'prática' },
    { commentAvaliable: ['teoria', 'pratica'], tagName: 'teoria e prática' },
  ])(
    'render Review Dialog with user comment and be able to edit comment %s %#',
    async ({ tagName, commentAvaliable }) => {
      server.use(
        http.get(`*/enrollments/*`, () =>
          HttpResponse.json({
            ...enrollment,
            comments: commentAvaliable,
            pratica: null,
            teoria: null,
            [commentAvaliable[0]]: {
              ...enrollment[commentAvaliable[0] as 'teoria' | 'pratica'],
              comment: {
                ...enrollment[commentAvaliable[0] as 'teoria' | 'pratica']
                  ?.comment,
                comment: userCreateComment.comment,
              },
            },
          })
        )
      );

      render(ReviewDialog, {
        props: {
          enrollment,
          showDialog: true,
          tags: [
            tagName,
            formatSeason(`${enrollment.year}:${enrollment.quad}`),
          ],
        },
      });
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(commentAreaPlaceholder)
        ).toHaveProperty('value', userCreateComment.comment);
      });

      await userEvent.clear(
        screen.getByPlaceholderText(commentAreaPlaceholder)
      );
      await userEvent.type(
        screen.getByPlaceholderText(commentAreaPlaceholder),
        userUpdateComment.comment
      );
      await userEvent.click(
        screen.getByRole('button', { name: /Atualizar comentário/iu })
      );

      await expectToasterToHaveText('Comentário editado com sucesso');
    }
  );
  test.each([
    { commentAvaliable: ['teoria'], tagName: 'teoria' },
    { commentAvaliable: ['pratica'], tagName: 'prática' },
    { commentAvaliable: ['teoria', 'pratica'], tagName: 'teoria e prática' },
  ])(
    'render Review Dialog with theorical subject type and missing atributes %s %#',
    async ({ tagName, commentAvaliable }) => {
      render(ReviewDialog, {
        props: {
          enrollment: {
            ...enrollment,
            _id: '31312312313',
            pratica: {
              __v: 0,
              _id: 'pratica-id',
              createdAt: new Date().toISOString(),
              name: 'Prática',
              updatedAt: new Date().toISOString(),
            },
            teoria: {
              __v: 0,
              _id: 'teoria-id',
              comment: {
                __v: 0,
                _id: 'comment-id',
                active: true,
                comment: userCreateComment.comment,
                createdAt: new Date().toISOString(),
                enrollment: enrollment._id,
                ra: '123456789',
                reactionsCount: { like: 0, recommendation: 0 },
                subject: 'subject-id',
                teacher: 'teacher-id',
                type: 'teoria',
                updatedAt: new Date().toISOString(),
                viewers: 20,
              },
              createdAt: new Date().toISOString(),
              name: 'Teoria',
              updatedAt: new Date().toISOString(),
            },
            ...Object.fromEntries(
              commentAvaliable.map((comment) => [
                comment,
                {
                  ...enrollment[comment as 'teoria' | 'pratica'],
                  _id: undefined,
                  name: undefined,
                },
              ])
            ),
          },
          showDialog: true,
          tags: [tagName],
        },
      });

      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(tagName)).toBeInTheDocument();
      await expectToasterToHaveText(
        'Erro ao carregar as informações do professor desta disciplina'
      );
    }
  );
  test('show error alert when fetching Teacher Enrollment Error', async () => {
    server.use(
      http.get(`*/enrollments/*`, () =>
        HttpResponse.json(null, { status: 500 })
      )
    );
    render(ReviewDialog, {
      props: {
        enrollment,
        showDialog: true,
        tags: [],
      },
    });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await expectToasterToHaveText(
      'Erro ao carregar as informações do professor desta disciplina'
    );
  });
  test('not render Dialog if props is false', () => {
    render(ReviewDialog, {
      props: {
        enrollment,
        showDialog: false,
        tags: ['teoria', formatSeason(`${enrollment.year}:${enrollment.quad}`)],
      },
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
