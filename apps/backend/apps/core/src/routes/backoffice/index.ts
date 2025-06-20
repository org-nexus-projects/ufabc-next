import { UserModel } from '@/models/User.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { z } from 'zod';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    '/token',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
        }),
      },
    },
    async (request, reply) => {
      const { email } = request.body;
      const isValid = app.config.BACKOFFICE_EMAILS?.includes(email);

      if (!isValid) {
        return reply.badRequest();
      }

      const user = await UserModel.findOne({
        email,
      });

      if (!user) {
        return reply.badRequest('User not found');
      }

      const token = app.jwt.sign(
        {
          _id: user._id,
          ra: user.ra,
          confirmed: user.confirmed,
          email: user.email,
          permissions: user.permissions ?? [],
        },
        { expiresIn: '2h' },
      );

      return {
        token,
      };
    },
  );

  app.get(
    '/jobs/failed',
    {
      // preHandler: (request, reply) => request.isAdmin(reply),
    },
    async (request, reply) => {
      const { reason, batchSize, queue } = request.query as {
        reason?: string;
        batchSize?: number;
        queue: string;
      };

      if (!reason) {
        return reply.badRequest('Missing reason');
      }

      const failedJobs = await app.job.getFailedByReason(
        queue,
        reason,
        batchSize ?? 500,
      );

      // log the quantity of failed jobs per reason
      return reply.send({
        count: failedJobs.length,
        data: failedJobs,
      });
    },
  );
};

export default plugin;
