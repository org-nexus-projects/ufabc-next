import type { FastifyInstance } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

/**
 * Validates requests and serializes responses with the Zod schemas declared
 * on each route.
 *
 * @see {@link https://github.com/turkerdev/fastify-type-provider-zod}
 */
export default fp(
  async (app: FastifyInstance) => {
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
  },
  { name: 'zod' }
);
