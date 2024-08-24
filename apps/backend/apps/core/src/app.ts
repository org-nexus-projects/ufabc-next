import { type FastifyServerOptions, fastify } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { loadPlugins } from './plugins.js';
import { entitiesModule } from './modules/Entities/entities.module.js';
import { publicModule } from './modules/Public/public.module.js';
import { nextUserModule } from './modules/NextUser/nextUser.module.js';
import { syncModule } from './modules/Sync/sync.module.js';
import { backOfficeModule } from './modules/backoffice/backoffice.module.js';
import { nextJobs } from './queue/NextJobs.js';
import { nextWorker } from './queue/NextWorker.js';
import { connect } from 'mongoose';
import { Config } from './config/config.js';

export async function buildApp(opts: FastifyServerOptions = {}) {
  const mongoConnection = await connect(Config.MONGODB_CONNECTION_URL)
  const app = fastify(opts);
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
    await app.register(backOfficeModule, {
      prefix: '/v2',
    });

    nextJobs.setup();
    nextWorker.setup();

    return app;
  } catch (error) {
    app.log.fatal({ error }, 'build app error');
     // Do not let the database connection hanging
    app.addHook('onClose', async () => {
      await mongoConnection.disconnect()
    })
    process.exit(1);
  }
}
