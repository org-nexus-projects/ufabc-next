import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { httpErrors } from '@fastify/sensible';
import { z } from 'zod';

import { legacyJwtHook } from '@/hooks/legacy-auth.js';
import {
  centralErrorHandler,
  schemaErrorFormatter,
} from '@/plugins/v2/error-handler.js';
import { TeacherModel } from '@/models/Teacher.js';
import {
  buildTeacherReviews,
  findAndUpdate,
  listAll,
  searchMany,
} from '@/routes/entities/teachers/service.js';
import {
  createTeachersSchema,
  listTeachersResponseSchema,
  searchTeacherSchema,
  searchTeachersResponseSchema,
  updateTeacherResponseSchema,
  updateTeacherSchema,
} from '@/schemas/entities/teachers.js';

const tags = ['Teachers'];

const teachersRoutes: FastifyPluginAsyncZod = async (scoped) => {
  scoped.setErrorHandler(centralErrorHandler);
  scoped.setSchemaErrorFormatter(schemaErrorFormatter);

  const teachersCache = scoped.cache<{}>();

  scoped.route({
    handler: async (_request, reply) =>
      await reply.status(200).send(await listAll()),
    method: 'GET',
    onRequest: legacyJwtHook,
    schema: {
      response: {
        200: listTeachersResponseSchema,
      },
      tags,
    },
    url: '/',
  });

  scoped.route({
    handler: async (request, reply) => {
      const { names } = request.body;

      const toInsert = names.map((name) => ({ name }));
      const insertedTeachers = await TeacherModel.create(toInsert);
      return await reply.status(200).send(insertedTeachers);
    },
    method: 'POST',
    onRequest: legacyJwtHook,
    schema: {
      body: createTeachersSchema.body,
      tags,
    },
    url: '/',
  });

  scoped.route({
    handler: async (request, reply) => {
      const { teacherId } = request.params;
      const { alias } = request.body;

      if (!teacherId) {
        throw httpErrors.badRequest('Missing teacherId');
      }

      const updatedTeacher = await findAndUpdate(teacherId, alias);

      if (!updatedTeacher) {
        throw httpErrors.badRequest('Teacher not found');
      }

      return await reply.status(200).send(updatedTeacher);
    },
    method: 'PUT',
    onRequest: legacyJwtHook,
    schema: {
      body: updateTeacherSchema.body,
      params: updateTeacherSchema.params,
      response: {
        200: updateTeacherResponseSchema,
      },
      tags,
    },
    url: '/:teacherId',
  });

  scoped.route({
    handler: async (request, reply) => {
      const { q } = request.query;

      const [searchResults] = await searchMany(q);

      return await reply.status(200).send(searchResults);
    },
    method: 'GET',
    onRequest: legacyJwtHook,
    schema: {
      querystring: searchTeacherSchema.querystring,
      response: {
        200: searchTeachersResponseSchema,
      },
      tags,
    },
    url: '/search',
  });

  scoped.route({
    handler: async (request, reply) => {
      const { teacherId } = request.params;

      if (!teacherId) {
        throw httpErrors.badRequest('Missing SubjectId');
      }

      const cacheKey = `reviews:${teacherId.toString()}`;
      const cached = teachersCache.get(cacheKey);

      if (cached) {
        return await reply.status(200).send(cached);
      }

      const resp = await buildTeacherReviews(teacherId);

      teachersCache.set(cacheKey, resp);

      return await reply.status(200).send(resp);
    },
    method: 'GET',
    schema: {
      params: z.object({
        teacherId: z.string(),
      }),
      tags,
    },
    url: '/reviews/:teacherId',
  });
};

export const teachersController: FastifyPluginAsyncZod = async (app) => {
  await app.register(teachersRoutes, { prefix: '/entities/teachers' });
};
