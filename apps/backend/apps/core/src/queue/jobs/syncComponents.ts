import { type Component, ComponentModel } from '@/models/Component.js';
import { type Subject, SubjectModel } from '@/models/Subject.js';
import { getComponents } from '@/modules-v2/ufabc-parser.js';
import { currentQuad, generateIdentifier } from '@next/common';
import { camelCase, startCase } from 'lodash-es';
import type { AnyBulkWriteOperation } from 'mongoose';
import type { QueueContext } from '../Worker.js';

export const COMPONENTS_QUEUE = 'sync_components_queue';

export async function syncComponents({ app }: QueueContext) {
  const tenant = currentQuad();
  const [year, quad] = tenant.split(':');
  const parserComponents = await getComponents();

  if (!parserComponents) {
    app.log.error({ parserComponents }, 'Error receiving components');
    throw new Error('Could not get components');
  }

  // Get existing subjects and create a case-insensitive lookup map
  const subjects = await SubjectModel.find({}, { name: 1, creditos: 1 }).lean();
  const subjectMap = new Map(
    subjects.map((subject) => [subject.name.toLowerCase(), subject]),
  );

  const bulkOperations: AnyBulkWriteOperation<Subject>[] = [];

  for (const component of parserComponents) {
    const normalizedName = component.name.toLowerCase();
    const existingSubject = subjectMap.get(normalizedName);

    if (!existingSubject) {
      // New subject - insert
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
      // Update existing subject if credits changed
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
    try {
      await SubjectModel.bulkWrite(bulkOperations, { ordered: false });
    } catch (error) {
      app.log.error({ error }, 'Error updating subjects');
      throw error;
    }
  }

  // Retrieve updated subjects for component processing
  const updatedSubjects = await SubjectModel.find({}, { name: 1 }).lean();
  const subjectsMap = new Map(
    updatedSubjects.map((subject) => [subject.name.toLowerCase(), subject._id]),
  );

  const componentBulkOperations: AnyBulkWriteOperation<Component>[] = [];

  for (const component of parserComponents) {
    const dbComponent = {
      codigo: component.UFComponentCode,
      disciplina_id: component.UFComponentId,
      campus: component.campus,
      disciplina: component.name,
      season: tenant,
      turma: component.turma,
      turno: component.turno,
      vagas: component.vacancies,
      ideal_quad: false,
      quad: Number(quad),
      year: Number(year),
      subject: subjectsMap.get(component.name.toLowerCase()),
      identifier: '',
      obrigatorias: component.courses
        .filter((c) => c.category === 'obrigatoria')
        .map((c) => c.UFCourseId),
    } as Component;

    // @ts-expect-error refactoring
    dbComponent.identifier = generateIdentifier(dbComponent, [
      'disciplina',
      'turno',
      'campus',
      'turma',
    ]);

    componentBulkOperations.push({
      updateOne: {
        filter: {
          season: tenant,
          identifier: dbComponent.identifier,
          disciplina_id: component.UFComponentId,
        },
        update: {
          $set: {
            ...dbComponent,
          },
          $setOnInsert: {
            alunos_matriculados: [],
            after_kick: [],
            before_kick: [],
          },
        },
        upsert: true,
      },
    });
  }

  if (componentBulkOperations.length > 0) {
    try {
      const result = await ComponentModel.bulkWrite(componentBulkOperations);
      return {
        msg: 'components updated/created',
        modifiedCount: result.modifiedCount,
        insertedCount: result.insertedCount,
        upsertedCount: result.upsertedCount,
      };
    } catch (error) {
      app.log.error({ error }, 'Error updating components');
      throw error;
    }
  }
}
