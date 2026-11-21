import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';
import {
  jsonSchemaTransform,
  jsonSchemaTransformObject,
} from 'fastify-type-provider-zod';

export async function swagger(app: FastifyInstance) {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'next - Documentation',
        description: 'Endpoints registrados pelo sistema',
        version: '0.1.0',
      },
      servers: [
        {
          url: 'https://api.v2.ufabcnext.com',
        },
      ],
    },
    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject,
    hideUntagged: true,
  });
  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });
  app.log.info('[PLUGIN] Swagger');
}

export default fp(swagger, { name: 'Documentation' });
