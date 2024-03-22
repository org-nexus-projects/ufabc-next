import { EnrollmentModel } from '@/models/Enrollment.js';
import { CommentModel } from '@/models/Comment.js';
import { authenticate } from '@/hooks/authenticate.js';
import { EnrollmentRepository } from './enrollments.repository.js';
import { EnrollmentHandler } from './enrollments.handlers.js';
import { EnrollmentService } from './enrollments.service.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function enrollmentsRoute(app: FastifyInstance) {
  const enrollmentRepository = new EnrollmentRepository(
    EnrollmentModel,
    CommentModel,
  );
  const enrollmentService = new EnrollmentService(enrollmentRepository);
  app.decorate('enrollmentService', enrollmentService);
  const enrollmentHandler = new EnrollmentHandler(enrollmentService);

  app.get(
    '/enrollment',
    { onRequest: [authenticate] },
    enrollmentHandler.studentEnrollment,
  );
  app.get<{ Params: { enrollmentId: string } }>(
    '/enrollment/:enrollmentId',
    { onRequest: [authenticate] },
    enrollmentHandler.enrollmentComment,
  );
}
