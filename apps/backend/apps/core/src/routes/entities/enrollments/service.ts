import { CommentModel } from '@/models/Comment.js';
import { ComponentModel } from '@/models/Component.js';
import { EnrollmentModel } from '@/models/Enrollment.js';
import type { SubjectDocument } from '@/models/Subject.js';
import type { TeacherDocument } from '@/models/Teacher.js';
import type { EnrollmentsList } from '@/schemas/entities/enrollments.js';
import type { currentQuad } from '@next/common';

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

  return populatedEnrollments as unknown as EnrollmentsList[];
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

export async function listWithComponents(ra: number, season: ReturnType<typeof currentQuad>) {
  // Fetch enrollments for the given ra and season
  const enrollments = await EnrollmentModel.find({
    ra,
    season,
  })
    .populate<{
      pratica: TeacherDocument;
      teoria: TeacherDocument;
    }>(['pratica', 'teoria'])
    .lean();

  // Gather all unique uf_cod_turma and disciplina_id from enrollments
  const ufCodTurmas = enrollments.map((enrollment) => enrollment.uf_cod_turma);
  const disciplinaIds = enrollments.map((enrollment) => enrollment.disciplina_id);

  // Fetch components that match the season and either uf_cod_turma or disciplina_id
  const matchingComponents = await ComponentModel.find({
    season,
    $or: [{ uf_cod_turma: { $in: ufCodTurmas } }, { disciplina_id: { $in: disciplinaIds } }],
  }).lean();

  // Build the payload by matching each enrollment to its component(s)
  const payload = enrollments.map((enrollment) => {
    // Find a component that matches by uf_cod_turma or disciplina_id and season
    const component = matchingComponents.find(
      (component) =>
        component.season === season &&
        (component.uf_cod_turma === enrollment.uf_cod_turma ||
          component.disciplina_id === enrollment.disciplina_id),
    );

    return {
      season,
      groupURL: component?.groupURL,
      codigo: component?.codigo,
      campus: enrollment.campus ?? component?.campus,
      turma: enrollment.turma ?? component?.turma,
      turno: enrollment.turno ?? component?.turno,
      subject: enrollment.disciplina ?? component?.disciplina,
      teoria: enrollment.teoria?.name ?? 'N/A',
      pratica: enrollment.pratica?.name ?? 'N/A',
    };
  });

  return payload;
}
