import { helpFormSchema } from '@/schemas/help.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    '/form',
    {
      schema: helpFormSchema,
    },
    async function(request, reply) {
      const formData = request.body;

      await app.job.dispatch('InsertNotionPage', formData);
    },
  );
};

export default plugin;
