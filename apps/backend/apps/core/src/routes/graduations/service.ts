import { GraduationSubjectModel } from '@/models/GraduationSubject.js';
import type { SubjectDocument } from '@/models/Subject.js';

type PopulatedFields = {
  subject: SubjectDocument;
};

export async function getTotal() {
  const graduationSubjectsCount = await GraduationSubjectModel.countDocuments();
  return graduationSubjectsCount;
}

export async function getPaginated(page: number, limit: number) {
  const paginatedGraduationSubjects = GraduationSubjectModel.find()
    .limit(limit)
    .skip((page - 1) * limit)
    .populate<PopulatedFields>('subject')
    .lean();

  return paginatedGraduationSubjects;
}

export async function listSubjectsById(graduationId: string, limit: number) {
  const subjects = await GraduationSubjectModel.find({
    graduation: graduationId,
  })
    .limit(limit)
    .populate<PopulatedFields>('subject')
    .lean();
  return subjects;
}
