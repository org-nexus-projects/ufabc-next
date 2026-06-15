import { enrollments } from '@/mocks/enrollments';
import { render, screen } from '@/test-utils';

import { PendingReviewEnrollment } from '.';

describe('<PendingReviewEnrollment />', () => {
  test('render the Pending Review Enrollment with a theorical only subject', async () => {
    render(PendingReviewEnrollment, {
      props: {
        enrollment: enrollments[1],
      },
    });
    expect(
      await screen.findByText(enrollments[1].disciplina),
    ).toBeInTheDocument();
    expect(screen.getByText('teoria')).toBeInTheDocument();
  });
  test('render the Pending Review Enrollment with a pratical only subject', async () => {
    render(PendingReviewEnrollment, {
      props: {
        enrollment: enrollments[30],
      },
    });
    expect(
      await screen.findByText(enrollments[30].disciplina),
    ).toBeInTheDocument();
    expect(screen.getByText('prática')).toBeInTheDocument();
  });
  test('render the Pending Review Enrollment with a theorical and pratical subject', async () => {
    render(PendingReviewEnrollment, {
      props: {
        enrollment: enrollments[0],
      },
    });
    expect(
      await screen.findByText(enrollments[0].disciplina),
    ).toBeInTheDocument();
    expect(screen.getByText('teoria e prática')).toBeInTheDocument();
  });
});
