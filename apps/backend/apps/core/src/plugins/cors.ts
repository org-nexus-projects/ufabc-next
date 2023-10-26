import { fastifyCors } from '@fastify/cors';
import { fastifyPlugin as fp } from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export async function cors(app: FastifyInstance) {
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

export default fp(cors, { name: 'Cors' });
