import { type FastifyServerOptions, fastify } from 'fastify';
import { mongoose } from '@/plugins/mongoose.js';
import { redis } from '@/plugins/redis.js';
import { jwtAuth } from '@/plugins/jwt.js';
import { cors } from '@/plugins/cors.js';
import { Config } from './config/config.js';
import { oauth2 } from './plugins/oauth2/oauth2.js';
import { nextRoutes, publicRoutes } from './modules/routes.js';

export async function buildApp(opts: FastifyServerOptions = {}) {
  const app = fastify(opts);
  try {
    // plugins
    await app.register(mongoose, {
      connectionUrl: Config.MONGODB_CONNECTION_URL,
    });
    await app.register(redis, Config);
    await app.register(jwtAuth, Config);
    await app.register(cors);
    await app.register(oauth2, Config);
    // routes
    await app.register(publicRoutes);
    await app.register(nextRoutes, {
      prefix: '/v2',
    });
  } catch (error) {
    app.log.fatal({ error }, 'build app error');
    throw error;
  }

  return app;
}
