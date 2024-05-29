import { authenticate } from '@/hooks/authenticate.js';
import { CommentModel } from '@/models/Comment.js';
import { EnrollmentModel } from '@/models/Enrollment.js';
import { EnrollmentHandler } from './enrollments.handlers.js';
import { EnrollmentRepository } from './enrollments.repository.js';
import { enrollmentCommentSchema, listStudentEnrollmentSchema } from './enrollments.schema.js';
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
    { schema: listStudentEnrollmentSchema, onRequest: [authenticate] },
    enrollmentHandler.studentEnrollment,
  );
  app.get<{ Params: { enrollmentId: string } }>(
    '/enrollment/:enrollmentId',
    { schema: enrollmentCommentSchema, onRequest: [authenticate] },
    enrollmentHandler.enrollmentComment,
  );
}
