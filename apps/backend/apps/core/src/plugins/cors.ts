import { fastifyCors } from '@fastify/cors';
import type { FastifyInstance } from 'fastify';

export async function cors(app: FastifyInstance) {
  // TODO: update when deploying
  try {
    await app.register(fastifyCors, {
      methods: ['GET', 'POST', 'PUT', 'UPDATE', 'DELETE'],
      origin: '*',
    });
    app.log.info('[PLUGIN] Cors');
  } catch (error) {
    app.log.error({ error }, '[PLUGIN] error in Cors');
  }
}
