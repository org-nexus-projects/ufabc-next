import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { JOB_NAMES, PARSER_WEBHOOK_SUPPORTED_EVENTS } from '@/constants.js';

import { createUfabcParserWebhookAuthHook } from '../hooks/ufabc-parser-webhook-auth.js';
import { UfabcParserWebhookSchema } from '../schemas/v2/webhook/ufabc-parser.js';

const UfabcParserIncomingWebhookController: FastifyPluginAsyncZod = async (
  app
) => {
  const webhookAuthHook = createUfabcParserWebhookAuthHook(app);

  app.route({
    method: 'POST',
    url: '/webhooks/ufabc-parser',
    schema: {
      headers: z.object({
        'x-webhook-signature': z.string().describe('HMAC-SHA256 signature'),
        'x-webhook-event': z
          .enum(PARSER_WEBHOOK_SUPPORTED_EVENTS)
          .describe('Event type'),
        'x-webhook-delivery-id': z
          .string()
          .uuid()
          .describe('Unique delivery ID'),
        'x-webhook-timestamp': z
          .string()
          .datetime()
          .describe('Event timestamp'),
      }),
      body: UfabcParserWebhookSchema,
      tags: ['webhook', 'ufabc-parser'],
      hide: true,
    },
    preHandler: webhookAuthHook,
    handler: async (request, reply) => {
      const deliveryId = request.headers['x-webhook-delivery-id'];
      const eventType = request.headers['x-webhook-event'];
      const timestamp = request.headers['x-webhook-timestamp'];

      request.log.info(
        {
          deliveryId,
          event: eventType,
          timestamp,
        },
        'Incoming webhook received from UFABC Parser'
      );

      const isDuplicate = await request.redisService.getJSON<string>(
        `webhook:${deliveryId}`
      );

      if (isDuplicate) {
        request.log.info({ deliveryId }, 'Duplicate webhook delivery detected');
        return reply.send({
          received: true,
          ignored: true,
          message: 'Duplicate delivery',
        });
      }

      await request.redisService.setJSON(
        `webhook:${deliveryId}`,
        'processed',
        '24h'
      );

      await app.manager.dispatch(JOB_NAMES.UFABC_PARSER_WEBHOOK_PROCESSING, {
        deliveryId,
        event: eventType,
        timestamp,
        data: request.body.data,
      });

      request.log.info(
        { deliveryId, jobName: JOB_NAMES.UFABC_PARSER_WEBHOOK_PROCESSING },
        'Webhook accepted and queued for processing'
      );

      return reply.send({
        received: true,
        deliveryId,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

export default UfabcParserIncomingWebhookController;
