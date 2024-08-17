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

  for (const [name, component] of componentsMap) {
    const existingSubject = existingSubjectsMap.get(name.toLocaleLowerCase());

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
    } else if (existingSubject.creditos !== component.credits) {
      bulkOperations.push({
        updateOne: {
          filter: {
            _id: existingSubject._id,
          },
          update: {
            $set: {
              creditos: component.credits,
              search: startCase(camelCase(existingSubject.name)),
              updatedAt: new Date(),
            },
          },
        },
      });
    }
  }

  if (bulkOperations.length > 0) {
    const result = await SubjectModel.bulkWrite(bulkOperations);
    logger.info({
      msg: 'subjects updated/created',
      modifiedCount: result.modifiedCount,
      insertedCount: result.insertedCount,
    });
    return {
      msg: 'subjects updated/created',
      modifiedCount: result.modifiedCount,
      insertedCount: result.insertedCount,
    };
  }

  logger.info('No subjects needed updating or creation');
  return {
    msg: 'No changes needed',
    updatedCount: 0,
    insertedCount: 0,
  };
}
