import type { EnrollmentRepository } from './enrollments.repository.js';

export class EnrollmentService {
  constructor(private readonly enrollmentRepository: EnrollmentRepository) {}

  async getEnrollment(ra: number, enrollmentId?: string) {
    const enrollmentMapping = {
      conceito: 1,
      subject: 1,
      disciplina: 1,
      pratica: 1,
      teoria: 1,
      year: 1,
      quad: 1,
      creditos: 1,
      updatedAt: 1,
      comments: 1,
    };
    if (enrollmentId) {
      const enrollment = await this.enrollmentRepository.findOne(
        {
          ra,
          _id: enrollmentId,
        },
        enrollmentMapping,
        ['pratica', 'teoria', 'subject'],
      );
      return enrollment;
    }
    const enrollment = await this.enrollmentRepository.findOne(
      {
        ra,
        conceito: { $in: ['A', 'B', 'C', 'D', 'O', 'F'] },
      },
      enrollmentMapping,
      ['pratica', 'teoria', 'subject'],
    );
    return enrollment;
  }

  async getComments(enrollmentId: string) {
    const comments = await this.enrollmentRepository.findEnrollmentComments({
      enrollment: enrollmentId,
    });
    return comments;
  }
}
