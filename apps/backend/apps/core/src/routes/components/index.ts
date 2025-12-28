// @ts-nocheck because of the inject method
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post('/', async (request, reply) => {
    return app
      .inject({
        method: request.method,
        url: '/v2/components/archives',
        body: request.body,
        headers: request.headers,
        query: request.query as any,
      })
      .then((res) => {
        reply.status(res.statusCode);
        reply.headers(res.headers);
        reply.send(res.body);
      });
  });
};

export default plugin;
