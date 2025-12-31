import mongoose, { type Mongoose, connect, connection, set } from 'mongoose';
import type { FastifyInstance } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';
import { inspect } from 'node:util'
import  {  StudentSync, type StudentSyncModel } from './models/student-sync.js'

declare module 'fastify' {
  interface FastifyInstance {
    db: Mongoose;
    models: {
      StudentSync: StudentSyncModel;
    };
    config: Record<string, any>;
  }
}

export default fp(
  async (app: FastifyInstance) => {
    try {
      connection.on('connected', () => {
        app.log.info('[MONGO] Connected to instance');
      });

      connection.on('error', (err) => {
        app.log.error(err, '[MONGO] Connection error');
      });

      connection.on('disconnected', () => {
        app.log.warn('[MONGO] Disconnected from instance');
      });

      const isLogDebug = app.config.NODE_ENV === 'dev' && app.config.LOG_LEVEL === 'debug';

      if (isLogDebug) {
        set('debug', (collection, method, query, doc, options) => {
          const queryStr = inspect(query, { depth: null, colors: false, breakLength: Infinity });
          app.log.debug({
            type: 'db',
            collection,
            method,
            query: queryStr,
            doc,
            options,
            message: `Mongoose: ${collection}.${method}(${queryStr})`
          })
        });
      }

      await connect(app.config.MONGODB_CONNECTION_URL, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      const models = {
        StudentSync,
      };

      app.decorate('db', mongoose);
      app.decorate('models', models);

      app.addHook('onClose', async (instance) => {
        await instance.db.connection.close();
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
  },
);
