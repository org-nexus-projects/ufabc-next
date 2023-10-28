import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
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
          url: 'http://localhost',
        },
      ],
    },
    hideUntagged: true,
  });
  await app.register(fastifySwaggerUi);
}
