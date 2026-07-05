import type { FastifyInstance, FastifyPluginOptions } from 'fastify';

import { fastifyPlugin as fp } from 'fastify-plugin';
import mongoose, { type Mongoose, connect } from 'mongoose';
import { inspect } from 'node:util';

import { db, type DatabaseModels } from './models.js';

declare module 'fastify' {
  interface FastifyInstance {
    mongoose: Mongoose;
    db: DatabaseModels;
  }
}

export type DatabasePluginOptions = FastifyPluginOptions & {
  mongodbConnectionUrl: string;
  nodeEnv: string;
  logLevel?: string;
}

export default fp(
  async (app: FastifyInstance, opts: DatabasePluginOptions) => {
    try {
      mongoose.connection.on('connected', () => {
        app.log.info('[MONGO] Connected to instance');
      });

      mongoose.connection.on('error', (err) => {
        app.log.error(err, '[MONGO] Connection error');
      });

      mongoose.connection.on('disconnected', () => {
        app.log.warn('[MONGO] Disconnected from instance');
      });

      const isLogDebug =
        opts.nodeEnv === 'dev' && opts.logLevel === 'debug';

      if (isLogDebug) {
        mongoose.set('debug', (collection, method, query, doc, options) => {
          const queryStr = inspect(query, {
            depth: null,
            colors: false,
            breakLength: Infinity,
          });
          app.log.info({
            type: 'db',
            collection,
            method,
            query: queryStr,
            doc,
            options,
            message: `Mongoose: ${collection}.${method}(${queryStr})`,
          });
        });
      }

      await connect(opts.mongodbConnectionUrl, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        autoIndex: opts.nodeEnv === 'dev',
      });

      app.decorate('rawMongoose', mongoose);
      app.decorate('db', db);

      app.addHook('onClose', async (instance) => {
        await mongoose.connection.close();
        instance.log.info('[MONGO] Connection closed');
      });

      app.log.info('[MONGO] Plugin initialized successfully');
    } catch (error) {
      app.log.error(error, '[MONGO] Failed to start');
      throw error;
    }
  },
  {
    name: 'mongoose-connector',
    dependencies: ['config'],
  }
);
