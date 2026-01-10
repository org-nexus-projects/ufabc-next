import type { FastifyInstance } from 'fastify';

import { fastifyPlugin as fp } from 'fastify-plugin';
import mongoose, { type Mongoose, connect } from 'mongoose';
import { inspect } from 'node:util';

import { db, type DatabaseModels } from './models.js';

declare module 'fastify' {
  interface FastifyInstance {
    rawMongoose: Mongoose;
    db: DatabaseModels;
    config: Record<string, any>;
  }
}

export default fp(
  async (app: FastifyInstance) => {
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
        app.config.NODE_ENV === 'dev' && app.config.LOG_LEVEL === 'debug';

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

      await connect(app.config.MONGODB_CONNECTION_URL, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        autoIndex: app.config.NODE_ENV === 'dev',
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
