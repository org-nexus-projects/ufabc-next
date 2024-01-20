import { generateIdentifier, logger } from '@next/common';
import { omit as LodashOmit } from 'lodash-es';
import { type EnrollmentDocument, EnrollmentModel } from '@/models/index.js';
import { batchInsertItems } from '../utils/batch-insert.js';

const processEnrollments = async (enrollment: EnrollmentDocument) => {
  const keys = ['ra', 'year', 'quad', 'disciplina'] as const;
  const key = {
    ra: enrollment.ra,
    year: enrollment.year,
    quad: enrollment.quad,
    disciplina: enrollment.disciplina,
  };

  const identifier = generateIdentifier(key, keys);
  const enrollmentsToUpdate = LodashOmit(enrollment, [
    'identifier',
    'id',
    '_id',
  ]);
  await EnrollmentModel.findOneAndUpdate(
    {
      identifier,
    },
    enrollmentsToUpdate,
    {
      new: true,
      upsert: true,
    },
  );
};

export function updateEnrollments(data: EnrollmentDocument[]) {
  try {
    return batchInsertItems(data, processEnrollments);
  } catch (error) {
    logger.error({ error }, 'Error updating enrollments');
    throw error;
  }
}
