import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { fastifyPlugin as fp } from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { fastifyZodOpenApiTransform, fastifyZodOpenApiTransformObject } from 'fastify-zod-openapi';

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
    transform: fastifyZodOpenApiTransform,
    transformObject: fastifyZodOpenApiTransformObject,
    hideUntagged: true,
  });
  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });
  app.log.info('[PLUGIN] Swagger');
}

export default fp(swagger, { name: 'Documentation' });
