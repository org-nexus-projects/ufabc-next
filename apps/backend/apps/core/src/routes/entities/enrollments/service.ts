import { CommentModel } from '@/models/Comment.js';
import { EnrollmentModel } from '@/models/Enrollment.js';
import type { SubjectDocument } from '@/models/Subject.js';
import type { TeacherDocument } from '@/models/Teacher.js';

type PopulatedFields = {
  pratica: TeacherDocument;
  teoria: TeacherDocument;
  subject: SubjectDocument;
};

export async function listByRa(ra: number) {
  const populatedEnrollments = await EnrollmentModel.find({
    ra,
    conceito: { $in: ['A', 'B', 'C', 'D', 'O', 'F'] },
  })
    .populate<PopulatedFields>(['pratica', 'teoria', 'subject'])
    .lean();

  return populatedEnrollments;
}

export async function findOne(id: string, ra: number) {
  const enrollment = await EnrollmentModel.findOne({
    _id: id,
    ra,
  })
    .populate<PopulatedFields>(['pratica', 'teoria', 'subject'])
    .lean();

  return enrollment;
}

export async function findComment(enrollmentId: string) {
  const comment = await CommentModel.find({ enrollment: enrollmentId }).lean();
  return comment;
}
