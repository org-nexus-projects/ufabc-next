import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { JOB_NAMES } from '@/constants.js';

import {
  HistoryWebhookRequestSchema,
  HistoryWebhookResponseSchema,
} from '../schemas/v2/webhook/history.js';

const WebhookController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/webhook/history',
    schema: {
      headers: z.object({
        'x-api-key': z.string().describe('API key for authentication'),
      }),
      body: HistoryWebhookRequestSchema,
      response: {
        200: HistoryWebhookResponseSchema,
        401: z.object({ error: z.string() }),
        400: z.object({ error: z.string() }),
        409: z.object({ error: z.string(), existingJobId: z.string() }),
        500: z.object({ error: z.string() }),
      },
      tags: ['webhook', 'history'],
      hide: false,
    },
    handler: async (request, reply) => {
      const apiKey = request.headers['x-api-key'];
      const validApiKey = app.config.WEBHOOK_API_KEY;

      if (!apiKey || apiKey !== validApiKey) {
        return reply.unauthorized();
      }

      const webhookData = request.body;
      const ra = webhookData.payload.ra;

      const idempotencyKey = `${ra}-${webhookData.payload.timestamp}`;

      const existingJob = await app.db.HistoryProcessingJob.findOne({
        idempotencyKey,
      });

      if (existingJob) {
        reply.log.debug(
          { existingJobId: existingJob._id.toString() },
          'Duplicate webhook request received'
        );
        return reply.conflict();
      }

      const processingJob = await app.db.HistoryProcessingJob.create({
        ra,
        idempotencyKey,
        payload: webhookData.payload,
        source: 'webhook',
      });

      const studentSyncRecord = await app.db.StudentSync.findOne({
        ra,
      });

      if (webhookData.type === 'history.error') {
        await processingJob.markFailed(
          {
            code: webhookData.payload.error.code,
            message: webhookData.payload.error.description,
            // @ts-ignore - 'details' was just added to the interface
            details: webhookData.payload.error.additionalData,
          },
          { source: 'webhook', immediate: true }
        );

        const errorRa = webhookData.payload.ra;
        await app.db.StudentSync.findOne({ ra: errorRa })?.then((record) =>
          record?.markFailed(
            `Webhook error: ${webhookData.payload.error.code} - ${webhookData.payload.error.description}`,
            {
              source: 'webhook',
              processingJobId: processingJob._id.toString(),
              error: webhookData.payload.error,
            }
          )
        );

        return reply.send({
          status: 'rejected',
          jobId: processingJob._id.toString(),
          message: 'Webhook error processed and marked as failed',
          timestamp: new Date().toISOString(),
        });
      }

      const login = studentSyncRecord?.timeline[0].metadata.login;
      const job = await app.manager.dispatch(JOB_NAMES.HISTORY_PROCESSING, {
        jobId: processingJob._id.toString(),
        webhookData: {
          type: webhookData.type,
          payload: {
            ...webhookData.payload,
            login,
          },
        },
      });

      const bgJobId = Array.isArray(job) ? job[0]?.id : job?.id;

      await processingJob.transition('processing', {
        bgJobId,
        source: 'webhook',
        webhookType: webhookData.type,
      });

      await studentSyncRecord?.transition('processing', {
        source: 'webhook',
        processingJobId: processingJob._id.toString(),
        bgJobId,
        webhookType: webhookData.type,
      });

      return reply.send({
        status: 'accepted',
        jobId: processingJob._id.toString(),
        message: 'Webhook received and queued for processing',
        timestamp: new Date().toISOString(),
      });
    },
  });

  app.route({
    method: 'GET',
    url: '/webhook/history/:jobId/status',
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
          status: z.enum(['created', 'processing', 'completed', 'failed', 'in_queue']),
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

      const { jobId } = request.params;

      const processingJob = await app.db.HistoryProcessingJob.findById(jobId);

      if (!processingJob) {
        return reply.status(404).send({ error: 'Job not found' });
      }

      return reply.send({
        jobId: processingJob._id.toString(),
        ra: processingJob.ra,
        status: processingJob.status,
        createdAt: processingJob.createdAt.toISOString(),
        updatedAt: processingJob.updatedAt.toISOString(),
        error: processingJob.error
          ? {
              code: processingJob.error.code || 'UNKNOWN',
              message: processingJob.error.message || 'Unknown error',
              type: processingJob.error.details?.type || 'UNKNOWN',
            }
          : undefined,
        timeline: processingJob.timeline.map((event) => ({
          status: event.status,
          timestamp: event.timestamp.toISOString(),
          note: event.metadata?.note || event.status,
          details: event.metadata,
        })),
      });
    },
  });
};

export default WebhookController;
