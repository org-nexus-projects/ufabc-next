import { batchInsertItems, generateIdentifier, logger } from '@next/common';
import { omit as LodashOmit } from 'lodash-es';
import {
  type EnrollmentDocument,
  EnrollmentModel,
} from '@/models/Enrollment.js';

async function processEnrollments(enrollment: EnrollmentDocument) {
  const key = {
    ra: enrollment.ra,
    year: enrollment.year,
    quad: enrollment.quad,
    disciplina: enrollment.disciplina,
  };

  const identifier = enrollment.identifier || generateIdentifier(key as any);
  const enrollmentsToUpdate = LodashOmit(enrollment, [
    'identifier',
    'id',
    '_id',
  ]);
  try {
    const updatedEnrollments = await EnrollmentModel.findOneAndUpdate(
      {
        identifier,
      },
      { $set: { enrollmentsToUpdate } },
      {
        new: true,
        upsert: true,
      },
    );
    return updatedEnrollments;
  } catch (error) {
    logger.error({ error }, 'Error updating enrollment');
    throw error;
  }
}

export async function updateEnrollments(data: EnrollmentDocument[]) {
  try {
    await batchInsertItems(data, processEnrollments);
  } catch (error) {
    logger.error({ error }, 'Error updating enrollments');
    throw error;
  }
}
