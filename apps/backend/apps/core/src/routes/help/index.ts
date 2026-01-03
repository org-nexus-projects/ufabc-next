import { type HelpForm } from '@/schemas/help.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    '/form',
    {
      schema: {
        tags: ['help'],
        consumes: ['multipart/form-data'],
      },
    },
    async (request, reply) => {
      try {
        // Get all parts from the request
        const parts = request.parts();
        const formData = {} as HelpForm;

        for await (const part of parts) {
          // Handle fields
          if (part.type === 'field') {
            const fieldName = part.fieldname as keyof HelpForm;
            formData[fieldName] = part.value as string;
          } else if (part.type === 'file' && part.fieldname === 'image') {
            // Handle image file
            const buffer = await part.toBuffer();
            formData.imageBuffer = buffer.toString('base64');
            formData.imageFilename = part.filename || 'image.png';
            formData.imageMimeType = part.mimetype;
          }
        }

        await app.job.dispatch('InsertNotionPage', formData);
        return reply.code(201).send({ success: true });
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
    }
  );
};

export default plugin;
