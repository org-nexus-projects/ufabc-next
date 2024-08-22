import {
  batchInsertItems,
  currentQuad,
  generateIdentifier,
} from '@next/common';
import { DisciplinaModel, type Component } from '@/models/Disciplina.js';
import { SubjectModel } from '@/models/Subject.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  ufProcessor,
  type UFProcessorComponent,
} from '@/services/ufprocessor.js';
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, UFProcessorComponent[]>({
  max: 1500,
  ttl: 1000 * 60 * 15, // 15 minutes
});

export async function syncComponentsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const season = currentQuad();
  const [tenantYear, tenantQuad] = season.split(':');
  const cacheKey = `sync:components:${season}`;
  let components = cache.get(cacheKey);

  if (!components) {
    components = await ufProcessor.getComponents();
    if (!components) {
      request.log.warn({ msg: 'Error in Ufabc Disciplinas', components });
      return reply.badRequest('Could not parse disciplinas');
    }
    cache.set(cacheKey, components);
  }

  const subjects: Array<{ name: string; _id: string }> =
    await SubjectModel.find({}, { name: 1 }).lean();
  const subjectMap = new Map(
    subjects.map((subject) => [subject.name.toLocaleLowerCase(), subject._id]),
  );
  const subjectNames = new Set(
    subjects.map(({ name }) => name.toLocaleLowerCase()),
  );
  const missingSubjects = components.filter(
    ({ name }) => !subjectNames.has(name.toLocaleLowerCase()),
  );
  const uniqMissing = [...new Set(missingSubjects.map(({ name }) => name))];

  if (missingSubjects.length > 0) {
    return {
      msg: 'missing subjects',
      uniqMissing,
    };
  }

  const nextComponents = components.map<Component>((component) => ({
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
    // @ts-ignore fix later
    subject: subjectMap.get(component.name) || null,
  }));

  const start = Date.now();
  const insertDisciplinasErrors = await batchInsertItems(
    nextComponents,
    (component) => {
      // this never had sense to me,
      // @ts-ignore migrating
      const identifier = generateIdentifier(component);
      return DisciplinaModel.findOneAndUpdate(
        {
          disciplina_id: component?.disciplina_id,
          identifier,
          season,
        },
        { ...component, identifier },
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
    componentsProcessed: components.length,
  };
}
