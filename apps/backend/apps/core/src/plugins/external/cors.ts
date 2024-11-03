import { fastifyCors } from '@fastify/cors';
import { fastifyPlugin as fp } from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export async function cors(app: FastifyInstance) {
  try {
    await app.register(fastifyCors, {
      origin: app.config.ALLOWED_ORIGINS,
    });
    app.log.info(
      `[PLUGIN] CORS, allowed for origins: ${app.config.ALLOWED_ORIGINS}`,
    );
  } catch (error) {
    app.log.error(error, '[PLUGIN] error in Cors');
  }
}

export default fp(cors, { name: 'Cors' });
