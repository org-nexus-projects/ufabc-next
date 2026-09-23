import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import { TeacherModel } from '@/models/Teacher.js';
import {
  createTeachersSchema,
  listTeachersSchema,
  searchTeacherSchema,
  updateTeacherSchema,
} from '@/schemas/entities/teachers.js';

import {
  buildTeacherReviews,
  findAndUpdate,
  listAll,
  searchMany,
} from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  const teachersCache = app.cache<{}>();

  app.get('/', { schema: listTeachersSchema }, async () => {
    const teachers = await listAll();
    return teachers;
  });

  app.post('/', { schema: createTeachersSchema }, async (request, reply) => {
    const { names } = request.body;

    if (Array.isArray(names)) {
      const toInsert = names.map((name) => ({ name }));
      const insertedTeachers = await TeacherModel.create(toInsert);
      return insertedTeachers;
    }

    // @ts-ignore - For now, after executing TS with node directly will be fixed
    const insertedTeacher = await TeacherModel.create({ names });
    return insertedTeacher;
  });

  app.put(
    '/:teacherId',
    { schema: updateTeacherSchema },
    async (request, reply) => {
      const { teacherId } = request.params;
      const { alias } = request.body;

      if (!teacherId) {
        return reply.badRequest('Missing teacherId');
      }

      const updatedTeacher = await findAndUpdate(teacherId, alias);

      if (!updatedTeacher) {
        return reply.badRequest('Teacher not found');
      }

      return updatedTeacher;
    }
  );

  app.get('/search', { schema: searchTeacherSchema }, async (request) => {
    const { q } = request.query;

    const [searchResults] = await searchMany(q);

    return searchResults;
  });

  app.get('/reviews/:teacherId', async (request, reply) => {
    const { teacherId } = request.params as { teacherId: string };

    if (!teacherId) {
      return reply.badRequest('Missing SubjectId');
    }

    const cacheKey = `reviews:${teacherId.toString()}`;
    const cached = teachersCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const resp = await buildTeacherReviews(teacherId);

    teachersCache.set(cacheKey, resp);

    return resp;
  });
};

export default plugin;
