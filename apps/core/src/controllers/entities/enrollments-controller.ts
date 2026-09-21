import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { httpErrors } from '@fastify/sensible';
import { currentQuad } from '@next/utils';
import { z } from 'zod';

import { legacyJwtHook } from '@/hooks/legacy-auth.js';
import type { TeacherDocument } from '@/models/Teacher.js';
import {
  centralErrorHandler,
  schemaErrorFormatter,
} from '@/plugins/v2/error-handler.js';
import {
  findComment,
  findOne,
  listByRa,
  listWithComponents,
} from '@/routes/entities/enrollments/service.js';
import {
  enrollmentsListSchema,
  listWppEnrollmentsSchema,
} from '@/schemas/entities/enrollments.js';

const tags = ['Enrollments'];

const enrollmentsRoutes: FastifyPluginAsyncZod = async (scoped) => {
  scoped.setErrorHandler(centralErrorHandler);
  scoped.setSchemaErrorFormatter(schemaErrorFormatter);

  scoped.route({
    handler: async ({ user }, reply) =>
      await reply.status(200).send(await listByRa(user.ra)),
    method: 'GET',
    onRequest: legacyJwtHook,
    schema: {
      response: {
        200: enrollmentsListSchema.array(),
      },
      tags,
    },
    url: '/',
  });

  scoped.route({
    handler: async ({ query, user }, reply) => {
      const { ra, season } = query as {
        ra: string;
        season: ReturnType<typeof currentQuad>;
      };

      const actualSeason = season ?? currentQuad();

      return await reply.status(200).send(await listWithComponents(user?.ra ?? ra, actualSeason));
    },
    method: 'GET',
    schema: {
      querystring: listWppEnrollmentsSchema.querystring,
      tags,
    },
    url: '/wpp',
  });

  scoped.route({
    handler: async (request, reply) => {
      const { enrollmentId } = request.params;
      const enrollment = await findOne(enrollmentId, request.user.ra);

      if (!enrollment) {
        throw httpErrors.badRequest('Enrollment not found');
      }

      const comments = await findComment(enrollmentId);

      if (!comments) {
        throw httpErrors.badRequest('No comments were found');
      }

      for (const comment of comments) {
        const teacher: TeacherDocument & { comment?: typeof comment } =
          enrollment[comment.type];
        teacher.comment = comment;
      }

      const { ra, ...res } = enrollment;

      return await reply.status(200).send(res);
    },
    method: 'GET',
    onRequest: legacyJwtHook,
    schema: {
      params: z.object({
        enrollmentId: z.string(),
      }),
      tags,
    },
    url: '/:enrollmentId',
  });
};

export const enrollmentsController: FastifyPluginAsyncZod = async (app) => {
  await app.register(enrollmentsRoutes, { prefix: '/entities/enrollments' });
};
