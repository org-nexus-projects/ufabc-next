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

export async function listWithComponents(
  ra: number,
  season: ReturnType<typeof currentQuad>,
) {
  const enrollments = await EnrollmentModel.find({
    ra,
    season: '2025:2',
  }).lean();
  const matchingComponents = await ComponentModel.find({
    season: '2025:2',
    uf_cod_turma: {
      $in: enrollments.map((enrollment) => enrollment.uf_cod_turma),
    },
  })
    .populate<{
      teoria: TeacherDocument;
      pratica: TeacherDocument;
    }>(['teoria', 'pratica'])
    .lean();

  // final payload
  /**
   * season,
   * groupURL,
   * codigo,
   * pratica/teoria,
   * campus,
   * turma,
   * turno,
   * disciplina,
   */

  const payload = enrollments.map((enrollment) => {
    const component = matchingComponents.find(
      (component) =>
        component.disciplina_id === enrollment.disciplina_id &&
        component.uf_cod_turma === enrollment.uf_cod_turma,
    );

    return {
      season,
      groupURL: component?.groupURL,
      codigo: enrollment.disciplina_id,
      campus: enrollment.campus,
      turma: enrollment.turma,
      turno: enrollment.turno,
      subject: enrollment.disciplina,
      teoria: component?.teoria?.name,
      pratica: component?.pratica?.name,
    };
  });

  return payload;
}
