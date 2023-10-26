import { connect } from 'mongoose';
import { fastifyPlugin as fp } from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import type { Config } from '../config/config.js';

type MongooseOptions = {
  connectionUrl: Config['MONGODB_CONNECTION_URL'];
};

async function mongoose(app: FastifyInstance, opts: MongooseOptions) {
  const connection = await connect(opts.connectionUrl);
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

export default fp(mongoose, { name: 'mongoose' });
