import { generateIdentifier, logger } from '@next/common';
import { omit as lodashOmit } from 'lodash-es';
import { type EnrollmentDocument, EnrollmentModel } from '@/models/index.js';
import { createQueue } from '../utils/queue.js';
import { batchInsertItems } from '../utils/batch-insert.js';
import type { Job } from 'bullmq';

async function updateEnrollments(data: EnrollmentDocument[]) {
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

export const updateEnrollmentsQueue = createQueue('Enrollments:Update');

export const addEnrollmentsToQueue = async (
  payload: Job<EnrollmentDocument[]>,
) => {
  await updateEnrollmentsQueue.add('Enrollments:Update', payload);
};

export const updateEnrollmentsWorker = async (
  job: Job<EnrollmentDocument[]>,
) => {
  try {
    await updateEnrollments(job.data);
  } catch (error) {
    logger.error(
      { error },
      'updateEnrollmentsWorker: Error updating enrollments',
    );
    throw error;
  }
};
