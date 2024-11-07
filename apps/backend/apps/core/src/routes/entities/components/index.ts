import { ComponentModel } from '@/models/Component.js';
import type { SubjectDocument } from '@/models/Subject.js';
import type { TeacherDocument } from '@/models/Teacher.js';
import {
  listComponentsSchema,
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
};

export default plugin;
