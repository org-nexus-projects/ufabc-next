import { fastifyJwt } from '@fastify/jwt';
import { fastifyPlugin as fp } from 'fastify-plugin';
import type { ObjectId } from 'mongoose';
import type { UserDocument } from '@/models/User.js';
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

export default fp(jwtAuth, { name: 'JsonWebToken' });

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      _id: ObjectId;
      confirmed: boolean;
      iat: number;
    };
    user: UserDocument | null;
  }
}
