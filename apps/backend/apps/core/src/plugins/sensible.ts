import { fastifySensible } from '@fastify/sensible';
import { fastifyPlugin as fp } from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

async function sensible(app: FastifyInstance) {
  try {
    await app.register(fastifySensible);
    app.log.info('[PLUGIN] Sensible');
  } catch (error) {
    app.log.error({ error }, '[PLUGIN] Error in sensible setup');
    throw new Error('[PLUGIN] error registering sensible', { cause: error });
  }
}

export default fp(sensible, { name: 'Sensible' });
