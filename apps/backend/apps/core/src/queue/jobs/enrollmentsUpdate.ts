import { batchInsertItems, generateIdentifier, logger } from '@next/common';
import { isEqual, omit as LodashOmit } from 'lodash-es';
import { type Enrollment, EnrollmentModel } from '@/models/Enrollment.js';

async function processEnrollments(enrollment: Enrollment) {
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
    const existingEnrollment = await EnrollmentModel.findOne({ identifier });
    if (existingEnrollment) {
      const existingData = LodashOmit(existingEnrollment.toObject(), [
        'identifier',
        'id',
        '_id',
        '__v',
      ]);
      if (isEqual(existingData, enrollmentsToUpdate)) {
        // nothing new
        return existingData;
      }
    }
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

export async function updateEnrollments(data: Enrollment[]) {
  try {
    const results = await batchInsertItems(data, processEnrollments);
    const updatedCount = results.filter((result) => result !== null).length;
    return {
      updatedCount,
    };
  } catch (error) {
    logger.error({ error }, 'Error updating enrollments');
    throw error;
  }
}
