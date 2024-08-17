import { Config } from '@/config/config.js';
import { SubjectModel, type Subject } from '@/models/Subject.js';
import { ufProcessor } from '@/services/ufprocessor.js';
import { logger } from '@next/common';
import { camelCase, startCase } from 'lodash-es';
import type { AnyBulkWriteOperation } from 'mongoose';

export async function syncSubjects() {
  const components = await ufProcessor.getComponents();
  const componentsMap = new Map(
    components.map((component) => [component.name, component]),
  );

  const existingSubjects = await SubjectModel.find(
    {},
    { name: 1, creditos: 1 },
  ).lean<Array<{ name: string; _id: string; creditos?: number }>>();
  const existingSubjectsMap = new Map(
    existingSubjects.map((subject) => [
      subject.name.toLocaleLowerCase(),
      subject,
    ]),
  );
  const bulkOperations: AnyBulkWriteOperation<Subject>[] = [];
  const missingCredits = [];

  for (const [name, component] of componentsMap) {
    const existingSubject = existingSubjectsMap.get(name);

    if (!existingSubject) {
      bulkOperations.push({
        insertOne: {
          document: {
            name: component.name,
            creditos: component.credits,
            search: startCase(camelCase(component.name)),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      });
    }

    if (existingSubject?.creditos !== component.credits) {
      bulkOperations.push({
        updateOne: {
          filter: {
            _id: existingSubject?._id,
          },
          update: {
            $set: {
              creditos: component.credits,
              search: startCase(camelCase(existingSubject?.name)),
            },
          },
        },
      });
    }
  }

  for (const [name, subject] of existingSubjectsMap) {
    if (!componentsMap.has(name)) {
      missingCredits.push(subject);
    }
  }

  if (missingCredits.length > 0 && Config.NODE_ENV !== 'dev') {
    logger.warn({ missingCredits }, 'Subjects without matching credits');
  }

  if (bulkOperations.length > 0) {
    const result = await SubjectModel.bulkWrite(bulkOperations);
    return {
      msg: 'subjects updated/created',
      modifiedCount: result.modifiedCount,
      insertedCount: result.insertedCount,
    };
  }

  return {
    msg: 'insights finish...',
    updatedCount: bulkOperations.length,
    missingCredits: missingCredits.length,
  };
}
