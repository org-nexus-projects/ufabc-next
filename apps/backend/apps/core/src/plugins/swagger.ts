import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import { fastifyPlugin as fp } from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export async function swagger(app: FastifyInstance) {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'UFABC Next - Docs',
        description: 'Documentação pública da api',
        version: '0.0.1',
      },
      servers: [
        {
          url: 'http://localhost:5000',
        },
      ],
    },
    transform: jsonSchemaTransform,
    hideUntagged: true,
  });
  await app.register(fastifySwaggerUi);
  app.log.info('[PLUGIN] Swagger');
}

export default fp(swagger, { name: 'Documentation' });
