import { helpFormSchema } from '@/schemas/help.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    '/form',
    {
      schema: helpFormSchema,
    },
    async (request, reply) => {
      const formData = request.body;
      try {
        const result = await app.job.dispatchAndWait('InsertNotionPage', formData as any);
        return reply.code(201).send({
          success: true,
          id: (result as any).id,
          url: (result as any).url,
        });
      } catch (error) {
        request.log.error({
          msg: 'Failed to create Notion page from help form',
          error: error instanceof Error ? error.message : String(error),
        });
        return reply.code(502).send({
          success: false,
          error: 'Failed to process help form. Please try again later.',
        });
      }
    },
  );
};

export default plugin;
