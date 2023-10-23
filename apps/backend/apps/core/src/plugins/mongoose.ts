import { connect } from 'mongoose';
import type { FastifyInstance } from 'fastify';
import type { Config } from '../config/config.js';

export default async function mongoose(app: FastifyInstance, opts: Config) {
  const connection = await connect(opts.MONGODB_CONNECTION_URL);
  try {
    app.decorate('mongoose', connection);
    app.log.info('[PLUGIN] Mongoose');
  } catch (error) {
    app.log.error({ error }, '[PLUGIN] Error Connecting to mongodb');
    // Do not let the database connection hanging
    app.addHook('onClose', async () => {
      await connection.disconnect();
    });
  }
}
