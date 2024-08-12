import { Config } from '@/config/config.js';
import { SubjectModel, type Subject } from '@/models/Subject.js';
import { ufProcessor } from '@/services/ufprocessor.js';
import { logger } from '@next/common';
import { camelCase, startCase } from 'lodash-es';
import type { AnyBulkWriteOperation } from 'mongoose';

export async function syncSubjects() {
  const components = await ufProcessor.getComponents();
  const creditsMap = new Map(
    components.map((component) => [component.name, component.credits]),
  );
  const bulkOps: AnyBulkWriteOperation<Subject>[] = [];
  const unregistered = [];

  const subjectsWithoutCredits = await SubjectModel.find(
    {
      creditos: {
        $exists: false,
      },
    },
    { name: 1 },
  ).lean<Array<{ name: string; _id: string }>>();

  for (const subject of subjectsWithoutCredits) {
    const caseFixedSubject = subject.name.toLocaleLowerCase();
    const credits = creditsMap.get(caseFixedSubject);

    if (!credits) {
      unregistered.push(subject.name);
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: subject._id },
        update: {
          $set: {
            creditos: credits,
            search: startCase(camelCase(subject.name)),
          },
        },
        upsert: false,
      },
    });
  }

  if (unregistered.length > 0 && Config.NODE_ENV !== 'dev') {
    logger.warn({ unregistered }, 'Subjects without matching credits');
  }

  if (bulkOps.length > 0) {
    const result = await SubjectModel.bulkWrite(bulkOps);
    logger.info({ modifiedCount: result.modifiedCount }, 'subjects updated');
  } else {
    logger.info('Nothing to update');
  }

  logger.info(
    {
      updatedCount: bulkOps.length,
      unregisteredCount: unregistered.length,
    },
    'insights finish...',
  );
}
