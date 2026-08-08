import { http, HttpResponse } from 'msw';

import { teacherSummary } from '@/mocks/reviews';
import { server } from '@/mocks/server';
import { render, screen, waitFor } from '@/test-utils';

import { TeacherSummary } from '.';

describe('<TeacherSummary />', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('shows a loading state before the summary text appears', async () => {
    render(TeacherSummary, {
      props: { teacherId: teacherSummary.teacher },
    });

    expect(
      await screen.findByText('Resumindo comentários...'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(teacherSummary.summary),
    ).not.toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(1600);

    expect(await screen.findByText(teacherSummary.summary)).toBeInTheDocument();
  });

  test('render the summary text and badges', async () => {
    render(TeacherSummary, {
      props: { teacherId: teacherSummary.teacher },
    });

    await vi.advanceTimersByTimeAsync(1600);

    expect(await screen.findByText(teacherSummary.summary)).toBeInTheDocument();
    expect(await screen.findByText('Boa didática')).toBeInTheDocument();
    expect(await screen.findByText('Não cobra presença')).toBeInTheDocument();
  });

  test('shows the "Gerado por IA" badge and an info tooltip button', async () => {
    render(TeacherSummary, {
      props: { teacherId: teacherSummary.teacher },
    });

    await vi.advanceTimersByTimeAsync(1600);

    expect(await screen.findByText('Gerado por IA')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Sobre este resumo' }),
    ).toBeInTheDocument();
  });

  test('shows the comments count and a fixed "Agora mesmo" timestamp', async () => {
    render(TeacherSummary, {
      props: { teacherId: teacherSummary.teacher },
    });

    await vi.advanceTimersByTimeAsync(1600);

    await screen.findByText(teacherSummary.summary);

    expect(
      screen.getByText(teacherSummary.commentsCount.toString()),
    ).toBeInTheDocument();
    expect(screen.getByText('Agora mesmo')).toBeInTheDocument();
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

    await vi.advanceTimersByTimeAsync(1600);

    await waitFor(() =>
      expect(
        screen.queryByText(teacherSummary.summary),
      ).not.toBeInTheDocument(),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
