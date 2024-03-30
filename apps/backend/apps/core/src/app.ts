import { type FastifyServerOptions, fastify } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

import { loadPlugins } from './plugins.js';
import { nextUserModule } from './modules/NextUser/nextUser.module.js';
import { entitiesModule } from './modules/Entities/entities.module.js';
import { publicModule } from './modules/Public/public.module.js';
import { syncModule } from './modules/Sync/sync.module.js';

export async function buildApp(opts: FastifyServerOptions = {}) {
  const app = fastify(opts);
  // Zod validation
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  try {
    await loadPlugins(app);
    await app.register(nextUserModule, {
      prefix: '/v2',
    });
    await app.register(entitiesModule, {
      prefix: '/v2',
    });
    await app.register(publicModule, {
      prefix: '/v2',
    });
    await app.register(syncModule, {
      prefix: '/v2',
    });
  } catch (error) {
    app.log.fatal(error, 'build app error');
    throw error;
  }

  return app;
}
