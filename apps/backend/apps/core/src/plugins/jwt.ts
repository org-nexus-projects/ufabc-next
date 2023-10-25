import { fastifyJwt } from '@fastify/jwt';
import type { FastifyInstance } from 'fastify';
import type { Config } from '@/config/config.js';

type JWTOptions = {
  secret: Config['JWT_SECRET'];
};

export async function jwtAuth(app: FastifyInstance, opts: JWTOptions) {
  try {
    await app.register(fastifyJwt, {
      secret: opts.secret,
    });
    app.log.info('[PLUGIN] JsonWebToken');
  } catch (error) {
    app.log.error({ error }, '[PLUGIN] error in JsonWebToken');
  }
}
