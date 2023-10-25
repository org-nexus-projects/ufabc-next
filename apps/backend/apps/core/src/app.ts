import { type FastifyServerOptions, fastify } from 'fastify';
import { Config } from './config/config.js';
import { nextRoutes, publicRoutes } from './modules/routes.js';
import oauth2 from './plugins/oauth2/oauth2.js';

export async function buildApp(opts: FastifyServerOptions = {}) {
  const app = fastify(opts);
  try {
    // await app.register(fastifyAutoload, {
    //   dir: join(dirEsm, 'plugins'),
    //   dirNameRoutePrefix: false,
    //   encapsulate: false,
    //   maxDepth: 1,
    //   options: Config,
    //   forceESM: true,
    // });
    await app.register(oauth2, Config);
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
