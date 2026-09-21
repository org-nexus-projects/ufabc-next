import type { SubjectDocument } from '@/models/Subject.js';

import { GraduationSubjectModel } from '@/models/GraduationSubject.js';

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

export async function listGraduationSubjectsPage(page: number, limit: number) {
  const [total, graduationSubjects] = await Promise.all([
    getTotal(),
    getPaginated(page, limit),
  ]);

  const pages = Math.ceil(total / limit);
  const results = graduationSubjects.map((g) => ({
    _id: g._id.toString(),
    name: g.subject.name,
    UFCode: g.codigo,
    credits: g.creditos,
    category: g.category,
    year: g.year,
    quad: g.quad,
  }));

  return {
    total,
    pages,
    data: results,
  };
}

export async function listGraduationSubjectsById(
  graduationId: string,
  limit: number
) {
  const graduationSubjects = await listSubjectsById(graduationId, limit);
  return { docs: graduationSubjects };
}
