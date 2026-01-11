import type { FastifyInstance } from 'fastify';

import fp from 'fastify-plugin';
import { connect, type Mongoose } from 'mongoose';

declare module 'fastify' {
  export interface FastifyInstance {
    mongoose: Mongoose;
  }
}

export default fp(
  async (app: FastifyInstance) => {
    app.decorate('mongoose', await connect(app.config.MONGODB_CONNECTION_URL));
    app.log.info('[MONGOOSE] connected');

    app.addHook('onClose', async (instance) => {
      await instance.mongoose.disconnect();
    });
  },
  { name: 'mongoose' }
);
