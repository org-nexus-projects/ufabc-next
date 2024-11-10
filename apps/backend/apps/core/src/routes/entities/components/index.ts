import { Component, ComponentModel } from '@/models/Component.js';
import { StudentModel } from '@/models/Student.js';
import type { SubjectDocument } from '@/models/Subject.js';
import type { TeacherDocument } from '@/models/Teacher.js';
import {
  listComponentsSchema,
  listKickedSchema,
  type NonPaginatedComponents,
} from '@/schemas/entities/components.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  const componentsListCache = app.cache<NonPaginatedComponents[]>();

  app.get('/', { schema: listComponentsSchema }, async (request, reply) => {
    const cacheKey = `list:components:${request.query.season}`;

    const cachedResponse = componentsListCache.get(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    const components = await ComponentModel.find(
      {
        season: request.query.season,
      },
      {
        _id: 0,
        alunos_matriculados: 1,
        campus: 1,
        pratica: 1,
        teoria: 1,
        vagas: 1,
        subject: 1,
        identifier: 1,
        ideal_quad: 1,
        turma: 1,
        turno: 1,
        disciplina_id: 1,
      },
    )
      .populate<{
        pratica: TeacherDocument;
        teoria: TeacherDocument;
        subject: SubjectDocument;
      }>(['pratica', 'teoria', 'subject'])
      .lean(true);

    const nonPaginatedComponents = components.map((component) => ({
      ...component,
      requisicoes: component.alunos_matriculados.length ?? [],
      teoria: component.teoria?.name,
      pratica: component.pratica?.name,
      subject: component.subject?.name,
      subjectId: component.subject?._id.toString(),
      teoriaId: component.teoria?._id.toString(),
      praticaId: component.pratica?._id.toString(),
    }));

    componentsListCache.set(cacheKey, nonPaginatedComponents);

    return nonPaginatedComponents;
  });

  app.get('/kicks', { schema: listKickedSchema }, async (request, reply) => {
    const component = await ComponentModel.findOne({
      season: request.query.season,
      disciplina_id: request.params.componentId,
    }).lean();

    if (!component) {
      return reply.notFound('Component not found');
    }

    // if a sort param has not been passed uses ideal_quad
    const kicks = request.query.sort
      ? [request.query.sort]
      : kickRule(component.ideal_quad, request.query.season);

    const kicksOrder = kicks.map((kick) =>
      kick === 'turno'
        ? component.turno === 'diurno'
          ? 'asc'
          : 'desc'
        : 'desc',
    );

    const isAfterKick = component.after_kick
      ? component.after_kick.length > 0
      : false;

    const resolveKicked = resolveEnrolled(component, isAfterKick);

    const kicksMap = new Map(
      resolveKicked.map((kicked) => [kicked.studentId, kicked]),
    );

    const students = await StudentModel.aggregate([
      {
        $match: {
          season: request.query.season,
          aluno_id: { $in: resolveKicked.map((kicked) => kicked.studentId) },
        },
      },
      { $unwind: '$cursos' },
    ]);

    const courses = await StudentModel.aggregate();
  });
};

function kickRule(idealQuad: boolean, season: string) {
  let coeffRule = null;
  if (
    season === '2020:2' ||
    season === '2020:3' ||
    season === '2021:1' ||
    season === '2021:2' ||
    season === '2021:3' ||
    season === '2022:1' ||
    season === '2022:2' ||
    season === '2022:3' ||
    season === '2023:1' ||
    season === '2023:2' ||
    season === '2023:3' ||
    season === '2024:1' ||
    season === '2024:2' ||
    season === '2024:3' ||
    season === '2025:1'
  ) {
    coeffRule = ['cp', 'cr'];
  } else {
    coeffRule = idealQuad ? ['cr', 'cp'] : ['cp', 'cr'];
  }

  return ['reserva', 'turno', 'ik'].concat(coeffRule);
}

function resolveEnrolled(component: Component, isAfterKick: boolean) {
  const {
    after_kick: afterKick,
    alunos_matriculados: enrolledStudentsIds,
    before_kick: beforeKick,
  } = component;

  // if kick has not arrived, no one has been kicked
  if (!isAfterKick) {
    const registeredStudentsIds = enrolledStudentsIds || [];
    return registeredStudentsIds.map((id) => ({
      studentId: id,
    }));
  }

  const kicked = beforeKick.filter((kick) => !afterKick.includes(kick));
  return beforeKick.map((id) => ({
    studentId: id,
    kicked: kicked.includes(id),
  }));
}

export default plugin;
