import type { FastifyInstance } from 'fastify';
import { fastifyRequestContext } from '@fastify/request-context';
import { fastifyPlugin as fp } from 'fastify-plugin';

export default fp(
  async function requestContextPlugin(app: FastifyInstance) {
    await app.register(fastifyRequestContext);
  },
  { name: 'request-context' }
);
