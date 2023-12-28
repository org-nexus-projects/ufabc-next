import { type FastifyServerOptions, fastify } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { addSyncToQueue } from '@next/queue';
import { DisciplinaModel } from '@next/models';
import { Config } from './config/config.js';

// Plugins
import mongoose from './plugins/mongoose.js';
import redis from './plugins/redis.js';
import jwtAuth from './plugins/jwt.js';
import cors from './plugins/cors.js';
import swagger from './plugins/swagger.js';
import oauth2 from './plugins/oauth2/oauth2.js';

// Routes
import { internalRoutes, nextRoutes, publicRoutes } from './modules/routes.js';

export async function buildApp(opts: FastifyServerOptions = {}) {
  const app = fastify(opts);
  // Zod validation
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  try {
    // plugins
    await app.register(cors);
    await app.register(mongoose, {
      connectionUrl: Config.MONGODB_CONNECTION_URL,
    });
    await app.register(redis, {
      username: Config.REDIS_USER,
      password: Config.REDIS_PASSWORD,
      host: Config.REDIS_HOST,
      port: Config.REDIS_PORT,
    });
    await app.register(jwtAuth, {
      secret: Config.JWT_SECRET,
    });
    await app.register(oauth2, {
      googleId: Config.OAUTH_GOOGLE_CLIENT_ID,
      googleSecret: Config.OAUTH_GOOGLE_SECRET,
      facebookId: Config.OAUTH_FACEBOOK_CLIENT_ID,
      facebookSecret: Config.OAUTH_FACEBOOK_SECRET,
    });
    await app.register(swagger);
    // routes
    await app.register(publicRoutes);
    await app.register(nextRoutes, {
      prefix: '/v2',
    });
    await app.register(internalRoutes, {
      prefix: '/v2',
    });

    //start running matriculas sync cron job
    // @ts-expect-error Mongoose Types
    await addSyncToQueue({ operation: '', disciplinaModel: DisciplinaModel });
  } catch (error) {
    app.log.fatal({ error }, 'build app error');
    throw error;
  }

  return app;
}
