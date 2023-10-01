import type { FastifyInstance } from 'fastify';
import type { Config } from '@/config/config.js';
import { fastifyJwt } from '@fastify/jwt';

export default async function jwtAuth(app: FastifyInstance, opts: Config) {
  try {
    await app.register(fastifyJwt, {
      secret: opts.JWT_SECRET,
    });
    app.log.info('[PLUGIN] JsonWebToken');
  } catch (error) {
    app.log.error({ error }, '[PLUGIN] error in JsonWebToken');
  }
}
