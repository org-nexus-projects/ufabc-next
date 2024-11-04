import JwtAuth from './plugins/jwt.js';
import { Config } from './config/config.js';
import type { FastifyInstance } from 'fastify';

export async function loadPlugins(app: FastifyInstance) {
  await Promise.all([
    app.register(JwtAuth, {
      secret: Config.JWT_SECRET,
    }),
  ]);
}
