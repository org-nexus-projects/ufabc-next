import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { findComment, findOne, listByRa, listWithComponents } from './service.js';
import { listUserEnrollments } from '@/schemas/entities/enrollments.js';
import { currentQuad } from '@next/common';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/', { schema: listUserEnrollments }, async ({ user }) => {
    const userEnrollments = await listByRa(user.ra);
    return userEnrollments;
  });

  app.get('/wpp', async ({ user, query }, reply) => {
    const { season, ra } = query as {
      season: ReturnType<typeof currentQuad>;
      ra: string;
    };

    const actualSeason = season ?? currentQuad();

    const wppEnrollments = await listWithComponents(user?.ra ?? ra, actualSeason);
    return wppEnrollments;
  });

  app.get('/:enrollmentId', async (request, reply) => {
    const { enrollmentId } = request.params as { enrollmentId: string };
    const enrollment = await findOne(enrollmentId, request.user.ra);

    if (!enrollment) {
      return reply.badRequest('Enrollment not found');
    }

    const comments = await findComment(enrollmentId);

    if (!comments) {
      return reply.badRequest('No comments were found');
    }

    // biome-ignore lint/complexity/noForEach: <explanation>
    comments.forEach((c) => {
      // @ts-expect-error for now
      enrollment[c.type].comment = c;
    });

    const { ra, ...res } = enrollment;
    return res;
  });
};

export default plugin;
