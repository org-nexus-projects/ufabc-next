import { http, HttpResponse } from 'msw';

import { teacherSummary } from '@/mocks/reviews';
import { server } from '@/mocks/server';
import { render, screen, waitFor } from '@/test-utils';

import { TeacherSummary } from '.';

describe('<TeacherSummary />', () => {
  test('render the summary text and badges', async () => {
    render(TeacherSummary, {
      props: { teacherId: teacherSummary.teacher },
    });

    expect(await screen.findByText(teacherSummary.summary)).toBeInTheDocument();
    expect(await screen.findByText('Boa didática')).toBeInTheDocument();
    expect(await screen.findByText('Não cobra presença')).toBeInTheDocument();
  });

  test('renders nothing when teacher has no summary yet', async () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    server.use(
      http.get(`${baseUrl}/entities/teachers/summary/*`, () =>
        HttpResponse.json({ message: 'not found' }, { status: 404 }),
      ),
    );

    render(TeacherSummary, {
      props: { teacherId: 'teacher-without-summary' },
    });

    await waitFor(() =>
      expect(screen.queryByLabelText('Carregando')).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByText(teacherSummary.summary),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
