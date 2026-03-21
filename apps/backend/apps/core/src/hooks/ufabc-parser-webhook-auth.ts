import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export function createUfabcParserWebhookAuthHook(app: FastifyInstance) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKey = request.headers['x-api-key'] as string;
    const deliveryId = request.headers['x-webhook-delivery-id'] as string;
    const webhookSecret = app.config.UFABC_PARSER_WEBHOOK_SECRET;

    if (!webhookSecret) {
      request.log.warn(
        { deliveryId },
        'Webhook secret not configured, skipping authentication'
      );
      return;
    }

    if (!apiKey || apiKey !== webhookSecret) {
      request.log.warn({ deliveryId }, 'Invalid webhook API key');
      return reply.status(401).send({
        error: 'Invalid API key',
        code: 'INVALID_API_KEY',
      });
    }
  };
}
