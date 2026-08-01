import type { FastifyInstance } from 'fastify';

import { fastifyMultipart } from '@fastify/multipart';
import { fastifyPlugin as fp } from 'fastify-plugin';

export default fp(async function multipart(app: FastifyInstance) {
  await app.register(fastifyMultipart);
});
