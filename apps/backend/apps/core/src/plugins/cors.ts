import type { FastifyInstance } from 'fastify';
import { fastifyCors } from '@fastify/cors';

export default async function cors(app: FastifyInstance) {
  // TODO: update when deploying
  try {
    await app.register(fastifyCors, {
      origin: '*',
    });
    app.log.info('[PLUGIN] Cors');
  } catch (error) {
    app.log.error({ error }, '[PLUGIN] error in Cors');
  }
}
