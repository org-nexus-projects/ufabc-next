import type { FastifyReply, FastifyRequest } from 'fastify';
import type { EnrollmentService } from './enrollments.service.js';

export class EnrollmentHandler {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  async studentEnrollment(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;

    if (!user?.ra) {
      return reply.badRequest('Missing student RA');
    }


    const userEnrollment = await this.enrollmentService.getEnrollment(user.ra);
    return [userEnrollment];
  }

  async enrollmentComment(
    request: FastifyRequest<{ Params: { enrollmentId: string } }>,
    reply: FastifyReply,
  ) {
    const user = request.user;
    const { enrollmentId } = request.params;

    if (!user?.ra) {
      return reply.badRequest('Missing student RA');
    }

    const enrollment = await this.enrollmentService.getEnrollment(
      user.ra,
      enrollmentId,
    );

    if (!enrollment) {
      return reply.notFound('Enrollment not found');
    }

    const comments = await this.enrollmentService.getComments(enrollmentId);

    if (!comments) {
      return reply.notFound('No comments were found');
    }

    comments.forEach((comment) => {
      // @ts-expect-error for now
      enrollment[comment.type].comment = comment;
    });

    const { ra, ...nonSensitiveEnrollment } = enrollment;
    return nonSensitiveEnrollment;
  }
}
