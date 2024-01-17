import { generateIdentifier } from '@next/common';
import { omit as lodashOmit } from 'lodash-es';
import { type EnrollmentDocument, EnrollmentModel } from '@/models/index.js';
import { batchInsertItems } from '../utils/batch-insert.js';

export async function updateEnrollments(data: EnrollmentDocument[]) {
  const errors = await batchInsertItems(
    data,
    async (enrollment: EnrollmentDocument): Promise<any> => {
      const keys = ['ra', 'year', 'quad', 'disciplina'] as const;

      const key = {
        ra: enrollment.ra,
        year: enrollment.year,
        quad: enrollment.quad,
        disciplina: enrollment.disciplina,
      };
      // @ts-expect-error Temp fix
      const identifier = generateIdentifier(key, keys);

      await EnrollmentModel.findOneAndUpdate(
        {
          identifier,
        },
        lodashOmit(enrollment, ['identifier', 'id', '_id']),
        {
          new: true,
          upsert: true,
        },
      );
    },
  );
  return errors;
}
