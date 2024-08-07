import {
  batchInsertItems,
  currentQuad,
  generateIdentifier,
} from '@next/common';
import { DisciplinaModel, type Disciplina } from '@/models/Disciplina.js';
import { SubjectModel } from '@/models/Subject.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ufProcessor } from '@/services/ufprocessor.js';

export async function syncDisciplinasHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const season = currentQuad();
  const [tenantYear, tenantQuad] = season.split(':');
  const components = await ufProcessor.getComponents();

  if (!components) {
    request.log.warn({ msg: 'Error in Ufabc Disciplinas', components });
    return reply.badRequest('Could not parse disciplinas');
  }

  const subjects: Array<{ name: string }> = await SubjectModel.find(
    {},
    { name: 1, _id: 0 },
  ).lean();
  const subjectNames = subjects.map(({ name }) => name.toLocaleLowerCase());
  const missingSubjects = components.filter(
    ({ name }) => !subjectNames.includes(name),
  );
  const names = missingSubjects.map(({ name }) => name);
  const uniqMissing = [...new Set(names)];

  if (missingSubjects.length > 0) {
    return {
      msg: 'missing subjects',
      uniqMissing,
    };
  }

  const nextComponents = components.map<Disciplina>((component) => ({
    codigo: component.UFComponentCode,
    disciplina_id: component.UFComponentId,
    campus: component.campus,
    disciplina: component.name,
    season,
    obrigatorias: component.courses.map((course) => course.UFCourseId),
    turma: component.turma,
    turno: component.turno,
    vagas: component.vacancies,
    // updated dynamically later
    alunos_matriculados: [],
    after_kick: [],
    before_kick: [],
    identifier: '',
    quad: Number(tenantQuad),
    year: Number(tenantYear),
  }));

  const start = Date.now();
  const insertDisciplinasErrors = await batchInsertItems(
    nextComponents,
    (component) => {
      return DisciplinaModel.findOneAndUpdate(
        {
          disciplina_id: component?.disciplina_id,
          // this never had sense to me,
          // @ts-ignore migrating
          identifier: generateIdentifier(component),
          season,
        },
        component,
        { upsert: true, new: true },
      );
    },
  );

  if (insertDisciplinasErrors.length > 0) {
    request.log.error({
      msg: 'Something bad happened',
      insertDisciplinasErrors,
    });
    return reply.internalServerError('Error inserting disciplinas');
  }

  return {
    status: 'Sync disciplinas successfully',
    time: Date.now() - start,
  };
}
