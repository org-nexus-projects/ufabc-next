import { UserModel } from '@/models/User.js';
import type { QueueNames } from '@/queue/types.js';
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
      schema: {
        querystring: z.object({
          reason: z.string(),
          batchSize: z.number().optional().default(500),
          queue: z.custom<QueueNames>((val) => {
            return (
              typeof val === 'string' &&
              Object.keys(app.job.queues).includes(val)
            );
          }),
        }),
      },
      // preHandler: (request, reply) => request.isAdmin(reply),
    },
    async (request, reply) => {
      const { reason, batchSize, queue } = request.query;

      if (!reason) {
        return reply.badRequest('Missing reason');
      }

      const failedJobs = await app.job.getFailedByReason(
        queue,
        reason,
        batchSize,
      );

      // log the quantity of failed jobs per reason
      return reply.send({
        count: failedJobs.length,
        data: failedJobs,
      });
    },
  );

  app.post(
    '/send-email',
    {
      schema: {
        body: z.object({
          subject: z.string().min(1),
          html: z.string().min(1),
          recipients: z.array(z.string().email()).min(1),
          from: z.string().email().optional(),
          batchSize: z.number().int().min(1).max(50).optional(),
        }),
      },
    },
    async (request, reply) => {
      const { subject, html, recipients, from, batchSize } = request.body;

      if (recipients.length === 0) {
        return reply.badRequest('Lista de destinatários vazia');
      }

      try {
        const job = await app.job.dispatch('SendBulkEmail', {
          subject,
          html,
          recipients,
          from,
          batchSize,
        });


        return reply.send({
          success: true,
          jobId: job.id,
          message: 'Email(s) enviado(s) para processamento',
          status: 'queued',
          recipients: recipients.length,
          estimatedBatches: Math.ceil(recipients.length / (batchSize || 50)),
        });
      } catch (error: any) {
        app.log.error({ error }, 'Erro ao enviar para fila');
        return reply.internalServerError('Erro ao processar envio');
      }
    },
  );
};

export default plugin;
