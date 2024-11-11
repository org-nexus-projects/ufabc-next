import type { QueueContext } from "@/lib/queue.server.js";
import { Component, ComponentModel } from "@/models/Component.js";
import { Subject, SubjectModel } from "@/models/Subject.js";
import { getComponents } from "@/modules-v2/ufabc-parser.js";
import { currentQuad, generateIdentifier } from "@next/common";
import { camelCase, startCase } from "lodash-es";
import { AnyBulkWriteOperation } from "mongoose";

export const COMPONENTS_QUEUE = 'sync_components_queue'

export async function syncComponentsProcessor({ app }: QueueContext<unknown>) {
  const tenant = currentQuad();
  const [year, quad] = tenant.split(':');
  const parserComponents = await getComponents()

  if (!parserComponents) {
    app.log.error({ parserComponents }, 'Error receiving components')
    throw new Error('Could not get components');
  }

  const subjects = await SubjectModel.find({}, { name: 1 }).lean()
  const uniqSubjects = new Set(
    subjects.map(({ name }) => name.toLocaleLowerCase()),
  );
  
  const missingSubjects = parserComponents.filter(({ name }) => !uniqSubjects.has(name));

  if (missingSubjects.length > 0) {
   const bulkOperations: AnyBulkWriteOperation<Subject>[] = [];
    app.log.info('Inserting new subjects')
    for (const component of parserComponents) {
      const existingSubject = subjects.find(s => s.name.toLocaleLowerCase() === component.name)
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
              },
            },
          },
        });
      }
    }
    
    await SubjectModel.bulkWrite(bulkOperations)
  } 

  const bulkOperations: AnyBulkWriteOperation<Component>[] = [];

  // retrieve after new subjects were inserted
  const updatedSubjects = await SubjectModel.find({}, { name: 1 }).lean();
  const subjectsMap = new Map(
    updatedSubjects.map((subject) => [
      subject.name.toLocaleLowerCase(),
      subject._id,
    ]),
  );

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
      subject: subjectsMap.get(component.name),
      identifier: '',
      // set only mandatory
      obrigatorias: component.courses.filter(c => c.category === 'obrigatoria').map(c => c.UFCourseId),
    } as Component

    // @ts-expect-error refactoring
    dbComponent.identifier = generateIdentifier(dbComponent, ['disciplina', 'turno', 'campus', 'turma'])
    
    bulkOperations.push({
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

  if (bulkOperations.length > 0) {
    const result = await ComponentModel.bulkWrite(bulkOperations);
    app.log.info({
      msg: 'components updated/created',
      modifiedCount: result.modifiedCount,
      insertedCount: result.insertedCount,
      upsertedCount: result.upsertedCount,
    });

    return {
      msg: 'components updated/created',
      modifiedCount: result.modifiedCount,
      insertedCount: result.insertedCount,
      upsertedCount: result.upsertedCount,
    };
  }

  app.log.info('No components needed updating or creation');
  return {
    msg: 'No changes needed',
    modifiedCount: 0,
    insertedCount: 0,
    upsertedCount: 0,
  };
}
