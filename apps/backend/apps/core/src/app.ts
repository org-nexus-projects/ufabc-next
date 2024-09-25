import { type FastifyServerOptions, fastify } from 'fastify';
import { loadPlugins } from './plugins.js';
import { entitiesModule } from './modules/entities/entities.module.js';
import { publicModule } from './modules/public/public.module.js';
import { userModule } from './modules/user/user.module.js';
import { syncModule } from './modules/sync/sync.module.js';
import { backOfficeModule } from './modules/backoffice/backoffice.module.js';
import { nextJobs } from './queue/NextJobs.js';
import { nextWorker } from './queue/NextWorker.js';
import { connect } from 'mongoose';
import { Config } from './config/config.js';
import { httpErrorsValidator } from './config/httpErrors.js';

export async function buildApp(opts: FastifyServerOptions = {}) {
  const mongoConnection = await connect(Config.MONGODB_CONNECTION_URL);
  const app = fastify(opts);

  try {
    httpErrorsValidator(app);
    await loadPlugins(app);
    await app.register(userModule, {
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
    await app.register(backOfficeModule, {
      prefix: '/v2',
    });

    nextJobs.setup();
    nextWorker.setup();

    return app;
  } catch (error) {
    app.log.fatal(error, 'build app error');
    // Do not let the database connection hanging
    app.addHook('onClose', async () => {
      await mongoConnection.disconnect();
    });
    process.exit(1);
  }
}
