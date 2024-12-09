import { ComponentModel } from '@/models/Component.js';
import { SubjectModel } from '@/models/Subject.js';
import { getComponents } from '@/modules/ufabc-parser.js';
import { currentQuad, generateIdentifier } from '@next/common';
import { camelCase, startCase } from 'lodash-es';
import type { QueueContext } from '../types.js';

type ParserComponent = Awaited<ReturnType<typeof getComponents>>[number];

export async function syncComponents({ app }: QueueContext<unknown>) {
  const tenant = currentQuad();
  const parserComponents = await getComponents();

  if (!parserComponents) {
    app.log.error({ parserComponents }, 'Error receiving components');
    throw new Error('Could not get components');
  }

  const componentsJobsPromises = parserComponents.map(async (component) => {
    try {
      await app.job.dispatch('ProcessSingleComponent', {
        component,
        tenant,
      });
    } catch (error) {
      app.log.error({
        error: error instanceof Error ? error.message : String(error),
        component: component.name,
        msg: 'Failed to dispatch component processing job',
      });
      throw error;
    }
  });

  await Promise.all(componentsJobsPromises);
}

export async function processComponent({
  app,
  job,
}: QueueContext<{
  component: ParserComponent;
  tenant: string;
}>) {
  if (!job.data.tenant || !job.data.component) {
    app.log.info('Discarding job with useless data');
    return;
  }
  const { component, tenant } = job.data;
  const [year, quad] = tenant.split(':').map(Number);

  try {
    const subject = await processSubject(component);
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
      quad,
      year,
      subject: subject._id,
      obrigatorias: component.courses
        .filter((c) => c.category === 'obrigatoria')
        .map((c) => c.UFCourseId),
      identifier: '',
    };

    dbComponent.identifier = generateIdentifier(dbComponent, [
      'disciplina',
      'turno',
      'campus',
      'turma',
    ]);

    app.log.debug(dbComponent, 'Generated component');

    const result = await ComponentModel.findOneAndUpdate(
      {
        season: tenant,
        identifier: dbComponent.identifier,
        disciplina_id: component.UFComponentId,
      },
      {
        $set: {
          ...dbComponent,
        },
        $setOnInsert: {
          alunos_matriculados: [],
          after_kick: [],
          before_kick: [],
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    app.log.debug({
      msg: 'Component processed successfully',
      identifier: dbComponent.identifier,
      id: result._id,
      action: result.isNew ? 'inserted' : 'updated',
    });
  } catch (error) {
    app.log.error({
      info: job.data,
      msg: 'Error processing component',
      error: error instanceof Error ? error.message : String(error),
      component: component.name,
    });

    throw error;
  }
}

async function processSubject(component: ParserComponent) {
  const normalizedName = component.name.toLowerCase();

  try {
    const existingSubjects = await SubjectModel.find({});
    const matchedSubject = existingSubjects.find(
      (subject) => subject.name.toLowerCase() === normalizedName,
    );
    if (matchedSubject) {
      matchedSubject.creditos = component.credits;
      matchedSubject.search = startCase(camelCase(normalizedName));
      await matchedSubject.save();
      return matchedSubject;
    }
    // Use findOneAndUpdate instead of separate find and update operations
    const newSubject = await SubjectModel.create({
      name: normalizedName,
      creditos: component.credits,
      search: startCase(camelCase(normalizedName)),
    });

    return newSubject;
  } catch (error: any) {
    if (error.code === 11000) {
      // Handle potential race condition by retrying the find
      const existingSubject = await SubjectModel.findOne({
        name: normalizedName,
      });
      if (existingSubject) {
        existingSubject.creditos = component.credits;
        await existingSubject.save();
        return existingSubject;
      }
    }
    throw error;
  }
}
