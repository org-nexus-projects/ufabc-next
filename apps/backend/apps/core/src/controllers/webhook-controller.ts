import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  HistoryWebhookRequestSchema,
  HistoryWebhookResponseSchema,
} from '@/schemas/webhook/history-payload';

const WebhookController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/history',
    schema: {
      headers: z.object({
        'x-api-key': z.string().describe('API key for authentication'),
        'content-type': z.literal('application/json').optional(),
      }),
      body: HistoryWebhookRequestSchema,
      response: {
        200: HistoryWebhookResponseSchema,
        401: z.object({ error: z.string() }),
        400: z.object({ error: z.string() }),
        409: z.object({ error: z.string(), existingJobId: z.string() }),
        500: z.object({ error: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const apiKey = request.headers['x-api-key'];
      const validApiKey = app.config.WEBHOOK_API_KEY;

      if (!apiKey || apiKey !== validApiKey) {
        return reply.status(401).send({ error: 'Invalid API key' });
      }

      try {
        const webhookData = request.body;
        const idempotencyKey = `${webhookData.payload.ra}-${webhookData.payload.timestamp}`;

        const existingJob = await app.db.models.HistoryProcessingJob.findOne({
          idempotencyKey,
        });

        if (existingJob) {
          return reply.status(409).send({
            error: 'Duplicate webhook request',
            existingJobId: existingJob._id.toString(),
          });
        }

        const processingJob = await app.db.models.HistoryProcessingJob.create({
          ra: webhookData.payload.ra,
          status: webhookData.type === 'error' ? 'failed' : 'pending',
          webhookTimestamp: webhookData.payload.timestamp,
          idempotencyKey,
          jobType: webhookData.type,
          payload: webhookData.payload,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const job = await app.jobManager.add('HISTORY_PROCESSING', {
          jobId: processingJob._id.toString(),
          webhookData,
        });

        await app.db.HistoryProcessingJob.findByIdAndUpdate(processingJob._id, {
          bgJobId: job.id,
          status: 'queued',
          updatedAt: new Date(),
        });

        return reply.send({
          status: 'accepted',
          jobId: processingJob._id.toString(),
          message: 'Webhook received and queued for processing',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        app.log.error('Webhook processing failed:', error);
        return reply.status(500).send({
          error: 'Internal server error',
        });
      }
    },
  });

  app.route({
    method: 'GET',
    url: '/history/:jobId/status',
    schema: {
      headers: z.object({
        'x-api-key': z.string().describe('API key for authentication'),
      }),
      params: z.object({
        jobId: z.string().describe('Processing job ID'),
      }),
      response: {
        200: z.object({
          jobId: z.string(),
          ra: z.string(),
          status: z.enum(['pending', 'processing', 'completed', 'failed']),
          createdAt: z.string().datetime(),
          updatedAt: z.string().datetime(),
          error: z
            .object({
              code: z.string(),
              message: z.string(),
              type: z.string(),
            })
            .optional(),
          timeline: z
            .array(
              z.object({
                status: z.string(),
                timestamp: z.string().datetime(),
                note: z.string(),
                details: z.record(z.any()).optional(),
              })
            )
            .optional(),
        }),
        401: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const apiKey = request.headers['x-api-key'];
      const validApiKey = app.config.WEBHOOK_API_KEY;

      if (!apiKey || apiKey !== validApiKey) {
        return reply.status(401).send({ error: 'Invalid API key' });
      }

      try {
        const { jobId } = request.params;

        const processingJob =
          await app.db.models.HistoryProcessingJob.findById(jobId);

        if (!processingJob) {
          return reply.status(404).send({ error: 'Job not found' });
        }

        return reply.send({
          jobId: processingJob._id.toString(),
          ra: processingJob.ra,
          status: processingJob.status,
          createdAt: processingJob.createdAt.toISOString(),
          updatedAt: processingJob.updatedAt.toISOString(),
          error: processingJob.error,
          timeline: processingJob.timeline,
        });
      } catch (error) {
        app.log.error('Status check failed:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  });
};

export default WebhookController;
