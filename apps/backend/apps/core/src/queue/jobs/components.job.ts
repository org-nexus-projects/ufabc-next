import { ComponentModel } from '@/models/Component.js';
import { SubjectModel } from '@/models/Subject.js';
import {
  type UfabcParserComponent,
  UfabcParserConnector,
} from '@/connectors/ufabc-parser.js';
import { currentQuad } from '@next/common';
import { camelCase, startCase } from 'lodash-es';
import type { QueueContext } from '../types.js';
import { logger } from '@/utils/logger.js';

export async function syncComponents({ app }: QueueContext<unknown>) {
  const tenant = currentQuad();
  const connector = new UfabcParserConnector();
  const parserComponents = await connector.getComponents();

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
  component: UfabcParserComponent;
  tenant: string;
}>) {
  if (!job.data.tenant || !job.data.component) {
    app.log.info('Discarding job with useless data');
    return;
  }
  const { component, tenant } = job.data;
  const [year, quad] = tenant.split(':').map(Number);

  const tpi = buildTPI(component.tpi);

  try {
    const subject = await processSubject(component);
    const dbComponent = {
      codigo: component.UFComponentCode,
      disciplina_id: component.UFComponentId,
      campus: component.campus,
      disciplina: component.name,
      season: tenant,
      turma: component.class,
      turno: component.shift === 'morning' ? 'diurno' : 'noturno',
      vagas: component.vacancies,
      ideal_quad: false,
      quad,
      year,
      subject: subject._id,
      obrigatorias: component.courses
        .filter((c) => c.category === 'mandatory')
        .map((c) => c.UFCourseId),
      uf_cod_turma: component.UFClassroomCode,
      tpi,
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
      }
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

async function processSubject(component: UfabcParserComponent) {
  const codeMatch = component.UFComponentCode.split('-')[0];
  if (!codeMatch) {
    logger.error({
      msg: 'Invalid component code',
      component: component.name,
    });
    throw new Error('Invalid component code');
  }

  try {
    const matchedSubject = await SubjectModel.findOne({
      uf_subject_code: { $in: [codeMatch] },
    });
    if (matchedSubject) {
      matchedSubject.creditos = component.credits;
      await matchedSubject.save();
      return matchedSubject;
    }

    const newSubject = await SubjectModel.create({
      name: component.name,
      creditos: component.credits,
      search: startCase(camelCase(component.name)),
      uf_subject_code: [codeMatch],
    });
    return newSubject;
  } catch (error: any) {
    if (error.code === 11000) {
      // Handle potential race condition by retrying the find
      const existingSubject = await SubjectModel.findOne({
        uf_subject_code: { $in: [codeMatch] },
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

const buildTPI = (tpi: UfabcParserComponent['tpi']) => {
  if (!tpi) {
    return [0, 0, 0];
  }
  return [tpi.theory, tpi.practice, tpi.individual];
};
