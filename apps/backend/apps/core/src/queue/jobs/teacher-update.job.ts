import { generateIdentifier } from '@next/common';

import { EnrollmentModel } from '@/models/Enrollment.js';
import { TeacherModel } from '@/models/Teacher.js';

import type { QueueContext } from '../types.js';

type ParsedData = {
  year: number;
  quad: number;
  disciplina: string;
  ra: number;
  teoria: string;
  pratica: string;
  credits: string;
};

type UpdateTeachers = ParsedData[];

//change name to offered classes
export async function updateTeachers(ctx: QueueContext<UpdateTeachers>) {
  const data = ctx.job.data;
  for (const enrollment of data) {
    try {
      const season = `${enrollment.year}:${enrollment.quad}`;
      const keys = ['ra', 'year', 'quad', 'disciplina'] as const;

      const key = {
        ra: enrollment.ra,
        year: enrollment.year,
        quad: enrollment.quad,
        disciplina: enrollment.disciplina,
      };

      const identifier = generateIdentifier(key, keys);

      // Find teoria teacher
      const teoriaTeacher = enrollment.teoria
        ? // @ts-ignore Complex Type Mismatch
          await TeacherModel.findByFuzzName(enrollment.teoria.toLowerCase())
        : null;

      // Find pratica teacher
      const praticaTeacher = enrollment.pratica
        ? // @ts-ignore Complex Type Mismatch
          await TeacherModel.findByFuzzName(enrollment.pratica.toLowerCase())
        : null;

      const result = await EnrollmentModel.findOneAndUpdate(
        { identifier },
        {
          $set: {
            ra: enrollment.ra,
            year: enrollment.year,
            quad: enrollment.quad,
            disciplina: enrollment.disciplina,
            credits: enrollment.credits,
            season,
            teoria: teoriaTeacher?._id || null,
            pratica: praticaTeacher?._id || null,
          },
        },
        { new: true, upsert: true }
      );

      ctx.app.log.debug(
        {
          identifier,
          enrollment: result,
          teoriaTeacher: teoriaTeacher?.name,
          praticaTeacher: praticaTeacher?.name,
        },
        'sucess'
      );
    } catch (error) {
      ctx.app.log.error(
        {
          identifier: generateIdentifier({
            ra: enrollment.ra,
            year: enrollment.year,
            quad: enrollment.quad,
            disciplina: enrollment.disciplina,
          }),
          error: error instanceof Error ? error.message : String(error),
          teoria: enrollment.teoria,
          pratica: enrollment.pratica,
        },
        'error'
      );
      throw error;
    }
  }
}
