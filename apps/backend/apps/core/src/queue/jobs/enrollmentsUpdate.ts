import { generateIdentifier, logger } from '@next/common';
import {
  type Enrollment as EnrollmentEntity,
  EnrollmentModel,
} from '@/models/Enrollment.js';
import type { HydratedComponent } from '@/modules/sync/utils/hydrateComponents.js';

type Enrollment = Omit<
  EnrollmentEntity,
  'createdAt' | 'updatedAt' | 'comments'
>;

export async function updateEnrollments(enrollments: HydratedComponent[]) {
  const operations = [];
  const resultsObject = {
    modifiedCount: 0,
    insertedCount: 0,
    errors: 0,
  };

  for (const enrollment of enrollments) {
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

    operations.push(
      EnrollmentModel.findOneAndUpdate(
        { identifier: data.identifier },
        {
          $set: {
            ...data,
            updatedAt: new Date(),
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      ).exec(),
    );
  }

  if (operations.length > 0) {
    try {
      // Process in batches of 50 to avoid overwhelming the system
      const batchSize = 50;
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        const results = await Promise.allSettled(batch);

        // Process results
        // biome-ignore lint/complexity/noForEach: <explanation>
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            if (result.value?._id) {
              if (result.value?.isNew) {
                resultsObject.insertedCount++;
              } else {
                resultsObject.modifiedCount++;
              }
            }
          } else {
            resultsObject.errors++;
            logger.error({
              msg: 'Error updating enrollment',
              error: result.reason,
            });
          }
        });
      }

      logger.info({
        msg: 'enrollments updated/created',
        modifiedCount: resultsObject.modifiedCount,
        insertedCount: resultsObject.insertedCount,
        errorCount: resultsObject.errors,
      });

      return {
        msg: 'enrollments processed',
        ...resultsObject,
      };
    } catch (error) {
      logger.error({
        msg: 'Error processing enrollments batch',
        error,
      });

      throw error;
    }
  }

  logger.info('No enrollments needed updating or creation');
  return {
    msg: 'No changes needed',
    modifiedCount: 0,
    insertedCount: 0,
    errors: 0,
  };
}
