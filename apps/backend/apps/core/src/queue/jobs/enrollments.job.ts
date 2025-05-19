import { generateIdentifier } from '@next/common';
import {
  type Enrollment as EnrollmentEntity,
  EnrollmentModel,
} from '@/models/Enrollment.js';
import type { QueueContext } from '../types.js';
import type { Types } from 'mongoose';

type HydratedComponent = {
  disciplinaId: number;
  codigo: string;
  disciplina: string;
  campus: 'sbc' | 'sa';
  turma: string;
  turno: 'diurno' | 'noturno';
  vagas: number;
  teoria: Types.ObjectId;
  pratica: Types.ObjectId;
  season: string;
  year: number;
  ra: number;
  quad: number;
  subject: Types.ObjectId;
};

//TODO: preciso mapear a alteracao aqui acima

type Enrollment = Omit<
  EnrollmentEntity,
  'createdAt' | 'updatedAt' | 'comments'
> & {
  disciplina_identifier?: string;
};

export async function processSingleEnrollment(
  ctx: QueueContext<HydratedComponent>,
) {
  const enrollment = ctx.job.data;

  try {
    const data: Enrollment = {
      ra: enrollment.ra,
      disciplina: enrollment.disciplina,
      campus: enrollment.campus,
      turno: enrollment.turno,
      turma: enrollment.turma,
      year: enrollment.year,
      quad: enrollment.quad,
      teoria: enrollment.teoria,
      pratica: enrollment.pratica,
      subject: enrollment.subject,
      season: enrollment.season,
    };

    data.identifier = generateIdentifier({
      ra: enrollment.ra,
      year: enrollment.year,
      quad: enrollment.quad,
      disciplina: enrollment.disciplina,
    });

    data.disciplina_identifier = generateIdentifier({
      year: enrollment.year,
      quad: enrollment.quad,
      disciplina: enrollment.disciplina,
    });

    const result = await EnrollmentModel.findOneAndUpdate(
      {
        ra: enrollment.ra,
        year: enrollment.year,
        quad: enrollment.quad,
        disciplina: enrollment.disciplina,
      },
      {
        $set: {
          ...data,
          identifier: data.identifier,
          disciplina_id: enrollment.disciplinaId,
        },
      },
      {
        new: true,
        upsert: true,
      },
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
