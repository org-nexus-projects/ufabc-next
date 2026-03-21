import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import crypto from 'crypto';

export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')}`;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

export function createUfabcParserWebhookAuthHook(app: FastifyInstance) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const signature = request.headers['x-webhook-signature'] as string;
    const deliveryId = request.headers['x-webhook-delivery-id'] as string;
    const webhookSecret = app.config.UFABC_PARSER_WEBHOOK_SECRET;

    if (!webhookSecret) {
      request.log.warn(
        { deliveryId },
        'Webhook secret not configured, skipping signature verification'
      );
      return;
    }

    const payload = JSON.stringify(request.body);
    const isValid = verifySignature(payload, signature, webhookSecret);

    if (!isValid) {
      request.log.warn({ deliveryId }, 'Invalid webhook signature');
      return reply.status(401).send({
        error: 'Invalid signature',
        code: 'INVALID_SIGNATURE',
      });
    }
  };
}
