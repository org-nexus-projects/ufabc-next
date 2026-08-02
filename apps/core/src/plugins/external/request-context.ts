import { fastifyRequestContext } from '@fastify/request-context';
import type { FastifyInstance } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';

export default fp(
  async (app: FastifyInstance) => {
    await app.register(fastifyRequestContext);
  },
  { name: 'request-context' }
);
