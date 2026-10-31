import type { FastifyInstance, FastifyRequest } from 'fastify';

import { InvalidWebhookApiKey } from '@/errors/custom-errors.js';

export function createUfabcParserWebhookAuthHook(app: FastifyInstance) {
  return async (request: FastifyRequest) => {
    const apiKey = request.headers['x-api-key'] as string;
    const deliveryId = request.headers['x-webhook-delivery-id'] as string;
    const webhookSecret = app.config.UFABC_PARSER_WEBHOOK_SECRET;

    if (!apiKey || apiKey !== webhookSecret) {
      request.log.warn({ deliveryId }, 'Invalid webhook API key');
      throw new InvalidWebhookApiKey();
    }
  };
}
