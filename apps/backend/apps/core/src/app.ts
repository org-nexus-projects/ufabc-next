import { type FastifyServerOptions, fastify } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { loadPlugins } from './plugins.js';

// Routes
import { internalRoutes, nextRoutes, publicRoutes } from './modules/routes.js';

export async function buildApp(opts: FastifyServerOptions = {}) {
  const app = fastify(opts);
  // Zod validation
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  try {
    // plugins
    await loadPlugins(app);

    // routes
    await app.register(publicRoutes);
    await app.register(nextRoutes, {
      prefix: '/v2',
    });
    await app.register(internalRoutes, {
      prefix: '/v2',
    });
  } catch (error) {
    app.log.fatal({ error }, 'build app error');
    throw error;
  }

  return app;
}
