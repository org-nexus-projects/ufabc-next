import { type FastifyServerOptions, fastify } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

import { loadPlugins } from './plugins.js';
import { internalRoutes, nextRoutes, publicRoutes } from './modules/routes.js';
import { addSyncToQueue } from './queue/jobs/syncMatriculas.js';

export async function buildApp(opts: FastifyServerOptions = {}) {
  const app = fastify(opts);
  // Zod validation
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  try {
    await loadPlugins(app);
    await app.register(publicRoutes);
    await app.register(nextRoutes, {
      prefix: '/v2',
    });
    await app.register(internalRoutes, {
      prefix: '/v2',
    });
    await addSyncToQueue({
      operation: 'alunos_matriculados',
      redis: app.redis,
    });
  } catch (error) {
    app.log.fatal({ error }, 'build app error');
    throw error;
  }

  return app;
}
