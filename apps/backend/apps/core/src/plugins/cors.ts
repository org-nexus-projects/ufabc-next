import { fastifyCors } from '@fastify/cors';
import { fastifyPlugin as fp } from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export async function cors(app: FastifyInstance, opts: { origins: string[] }) {
  try {
    await app.register(fastifyCors, {
      origin: opts.origins,
    });
    app.log.info(`[PLUGIN] CORS, allowed for origins: ${opts.origins.join(',')}`);
  } catch (error) {
    app.log.error({ error }, '[PLUGIN] error in Cors');
  }
}

export default fp(cors, { name: 'Cors' });
