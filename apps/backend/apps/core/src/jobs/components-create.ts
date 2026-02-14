import { defineJob } from '@next/queues/client';

import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { JOB_NAMES } from '@/constants.js';
import { ComponentModel, type Component } from '@/models/Component.js';

import { findOrCreateSubject } from './utils/subject-resolution.js';

const connector = new UfabcParserConnector();

export const createComponentJob = defineJob(JOB_NAMES.CREATE_COMPONENT).handler(
  async ({ job }) => {
    const { componentId } = job.data;
    const [component] = await connector.getComponent(componentId);

    if (!component) {
      throw new Error('Component not found');
    }

    const subjectCode = component.ufComponentCode.split('-')[0];
    const subject = await findOrCreateSubject(
      component.name,
      component.credits,
      subjectCode
    );

    const dbComponent = {
      after_kick: [],
      before_kick: [],
      alunos_matriculados: [],
      disciplina_id: component.ufComponentId,
      disciplina: subject.name,
      turno: component.shift === 'morning' ? 'diurno' : 'noturno',
      turma: component.componentClass,
      vagas: component.vacancies,
      obrigatorias: component.courses?.filter((c) => c.category === 'mandatory').map((c) => c.UFCourseId) ?? [],
      uf_cod_turma: component.ufClassroomCode,
      campus: component.campus,
      codigo: component.ufComponentCode,
      kind: 'api',
      ideal_quad: false,
      tpi: [
        component.tpi.theory,
        component.tpi.practice,
        component.tpi.individual,
      ],
      subject: subject._id,
      year: Number(component.season.split(':')[0]),
      quad: Number(component.season.split(':')[1]),
      season: component.season,
    } satisfies Omit<Component, 'createdAt' | 'updatedAt'>;

    const createdComponent = await ComponentModel.findOneAndUpdate(
      { season: component.season, uf_cod_turma: component.ufClassroomCode },
      dbComponent,
      { upsert: true, new: true }
    );
    return {
      success: true,
      component: createdComponent._id,
    };
  }
);
