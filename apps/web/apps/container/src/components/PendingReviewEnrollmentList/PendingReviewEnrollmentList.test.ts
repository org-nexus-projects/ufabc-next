import { http,HttpResponse } from 'msw';

import { enrollments } from '@/mocks/enrollments';
import { server } from '@/mocks/server';
import { render, screen, userEvent } from '@/test-utils';

import { PendingReviewEnrollmentList } from '.';

describe('<PendingReviewEnrollmentList />', () => {
  test('render Pending Review Enrollments List with a reviewable subjects', async () => {
    render(PendingReviewEnrollmentList);
    expect(
      await screen.findByText(/Seus professores para avaliar/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(enrollments[26].subject.name),
    ).toBeInTheDocument();
    expect(screen.getByText('teoria')).toBeInTheDocument();
    expect(screen.getByText(enrollments[27].subject.name)).toBeInTheDocument();
    expect(screen.getByText('prática')).toBeInTheDocument();
    expect(screen.getByText(enrollments[28].subject.name)).toBeInTheDocument();
    expect(screen.getByText('teoria e prática')).toBeInTheDocument();
  });
  test('render Pending Review Enrollments List with error', async () => {
    server.use(
      http.get(`*/enrollments`, () => HttpResponse.json(null, { status: 500 })),
    );
    render(PendingReviewEnrollmentList);
    expect(
      await screen.findByText('Erro ao buscar suas disciplinas cursadas'),
    ).toBeInTheDocument();
  });
  test('open Review Dialog when click on Enrollment and close when click on clos', async () => {
    render(PendingReviewEnrollmentList);
    await userEvent.click(
      screen.getByRole('button', {
        name: RegExp(enrollments[26].subject.name, 'i'),
      }),
    );
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
