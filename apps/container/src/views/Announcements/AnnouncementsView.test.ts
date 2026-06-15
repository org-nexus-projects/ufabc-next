import { http, HttpResponse } from 'msw';
import { createPinia, setActivePinia } from 'pinia';

import { server } from '@/mocks/server';
import { user as mockedUser } from '@/mocks/users';
import { useAuthStore } from '@/stores/auth';
import {
  expectToasterToHaveText,
  render,
  screen,
  userEvent,
  waitFor,
} from '@/test-utils';
import { PERMISSIONS } from '@/utils/consts';

import { AnnouncementsView } from '.';

const courses = [
  {
    id: 1,
    name: 'Bacharelado em Ciência da Computação',
    ufComponentCodes: [],
    ufabcCourseIdentifier: 76,
    componentKeys: [],
  },
  {
    id: 2,
    name: 'Bacharelado em Ciência e Tecnologia',
    ufComponentCodes: [],
    ufabcCourseIdentifier: 42,
    componentKeys: [],
  },
];

const fillValidAnnouncementForm = async () => {
  const user = userEvent.setup();

  await user.click(await screen.findByLabelText('Selecionar um Curso'));
  await user.click(
    await screen.findByText('Bacharelado em Ciência e Tecnologia'),
  );
  await user.type(
    screen.getByLabelText('Texto do Anúncio'),
    'A matricula abre hoje.',
  );

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeEnabled();
  });

  return user;
};

describe('<AnnouncementsView />', () => {
  let authStore: ReturnType<typeof useAuthStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    authStore.user = {
      ...mockedUser,
      permissions: [PERMISSIONS.ADMIN],
    };

    server.use(
      http.get(
        'https://ufabc-parser.com/v2/components/curriculum/subjects',
        () => HttpResponse.json(courses),
      ),
    );
  });

  afterEach(() => {
    authStore.user = null;
    authStore.token = null;
  });

  test('sends announcement with selected course, fixed season and text', async () => {
    const requestBodies: unknown[] = [];

    server.use(
      http.post('*/v2/announcement', async ({ request }) => {
        requestBodies.push(await request.json());
        return HttpResponse.json({});
      }),
    );

    render(AnnouncementsView);

    const user = await fillValidAnnouncementForm();
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => {
      expect(requestBodies).toEqual([
        {
          courseIdentifier: 42,
          season: '2026:2',
          text: 'A matricula abre hoje.',
        },
      ]);
    });
    await expectToasterToHaveText('Anúncio está sendo enviado para os grupos!');
  });

  test('keeps submit disabled while form is invalid', async () => {
    render(AnnouncementsView);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
    });
  });

  test('shows error toaster when announcement submission fails', async () => {
    server.use(
      http.post('*/v2/announcement', () =>
        HttpResponse.json({ error: 'serviço indisponível' }, { status: 500 }),
      ),
    );

    render(AnnouncementsView);

    const user = await fillValidAnnouncementForm();
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await expectToasterToHaveText(
      'Erro ao enviar anúncio: serviço indisponível',
    );
  });
});
