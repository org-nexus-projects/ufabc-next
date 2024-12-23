import { fastifyJwt } from '@fastify/jwt';
import { fastifyPlugin as fp } from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      _id: string;
      ra: number;
      confirmed: boolean;
      email: string;
      permissions: string[];
    };
  }
}

export async function jwtAuth(app: FastifyInstance) {
  try {
    await app.register(fastifyJwt, {
      secret: app.config.JWT_SECRET,
    });
    app.log.info('[PLUGIN] JsonWebToken');
  } catch (error) {
    app.log.error({ error }, '[PLUGIN] error in JsonWebToken');
  }
}

export default fp(jwtAuth, { name: 'JsonWebToken' });
