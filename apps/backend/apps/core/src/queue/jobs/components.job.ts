import { ComponentModel } from '@/models/Component.js';
import { SubjectModel } from '@/models/Subject.js';
import { getComponents } from '@/modules/ufabc-parser.js';
import { currentQuad } from '@next/common';
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

  app.log.info({
    msg: 'ComponentsSync tasks dispatched',
    totalEnrollments: componentsJobsPromises.length,
  });
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
      uf_cod_turma: component.UFClassroomCode,
      tpi: component.rawTPI,
    };

    app.log.debug(dbComponent, 'Generated component');

    const result = await ComponentModel.findOneAndUpdate(
      {
        season: tenant,
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
      identifier: dbComponent.uf_cod_turma,
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
  // Normalize the subject code (strip year, uppercase, etc.)
  const codeMatch = component.UFComponentCode.match(/^(.*?)-\d{2}$/);
  const normalizedCode = codeMatch ? codeMatch[1] : component.UFComponentCode;

  try {
    // Find subject by uf_subject_code
    const matchedSubject = await SubjectModel.findOne({
      uf_subject_code: { $in: [normalizedCode] },
    });
    if (matchedSubject) {
      matchedSubject.creditos = component.credits;
      await matchedSubject.save();
      return matchedSubject;
    }
    // Create new subject with uf_subject_code as array
    const newSubject = await SubjectModel.create({
      name: component.name,
      creditos: component.credits,
      search: startCase(camelCase(component.name)),
      uf_subject_code: [normalizedCode],
    });
    return newSubject;
  } catch (error: any) {
    if (error.code === 11000) {
      // Handle potential race condition by retrying the find
      const existingSubject = await SubjectModel.findOne({
        uf_subject_code: { $in: [normalizedCode] },
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
