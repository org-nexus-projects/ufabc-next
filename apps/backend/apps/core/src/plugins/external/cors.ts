import { fastifyCors } from '@fastify/cors';
import { fastifyPlugin as fp } from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export async function cors(app: FastifyInstance) {
  try {
    await app.register(fastifyCors, {
      origin: '*',
    });
    app.log.info(
      `[PLUGIN] CORS, allowed for origins: ${app.config.ALLOWED_ORIGINS}`
    );
  } catch (error) {
    app.log.error(error, '[PLUGIN] error in Cors');
  }
}

export default fp(cors, { name: 'Cors' });

/**
 * , {
      origin: (origin, cb) => {
        if (!origin) {
          cb(null, true);
          return;
        }

        if (app.config.ALLOWED_ORIGINS.indexOf(origin) !== -1) {
          cb(null, true);
          return;
        }

        cb(new Error('Not allowed by CORS'), false);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      maxAge: 86400, // 24 hours
      preflight: true,
      // Optionally add other headers you want to allow
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
      ],
    }
 */
