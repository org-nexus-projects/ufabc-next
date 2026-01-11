import type { StudentEnrollment } from '@/routes/sync/index.js';

import { EnrollmentModel } from '@/models/Enrollment.js';

import type { QueueContext } from '../types.js';

export async function processSingleEnrollment(
  ctx: QueueContext<StudentEnrollment>
) {
  const enrollment = ctx.job.data;

  try {
    const normalizedDisciplina = normalizeText(enrollment.disciplina);

    const result = await EnrollmentModel.findOneAndUpdate(
      {
        ra: enrollment.ra,
        $or: [
          { disciplina: normalizedDisciplina },
          { disciplina: { $regex: normalizedDisciplina, $options: 'i' } },
          {
            disciplina: {
              $regex: normalizedDisciplina
                .split(/\s+/)
                .map((word) => `(?=.*${word})`)
                .join(''),
              $options: 'i',
            },
          },
          { disciplina: { $regex: enrollment.disciplina, $options: 'i' } },
        ],
        year: enrollment.year,
        quad: enrollment.quad,
      },
      {
        $set: {
          ...enrollment,
          disciplina_id: enrollment.disciplina_id,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    ctx.app.log.debug({
      msg: 'Enrollment processed',
      ra: enrollment.ra,
      disciplina: enrollment.disciplina,
      action: result?.isNew ? 'inserted' : 'updated',
    });
  } catch (error) {
    ctx.app.log.error({
      msg: 'Error processing single enrollment',
      error: error instanceof Error ? error.message : String(error),
      enrollment,
    });
    throw error;
  }
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}
