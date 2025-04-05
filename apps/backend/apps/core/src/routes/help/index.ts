import { listGraduationsSubjectsSchema } from '@/schemas/graduations.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { z } from 'zod';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    '/form',
    {
      schema: {
        body: {
          email: z.string().email(),
          ra: z.string(),
          problemTitle: z.string(),
          problemDescription: z.string(),
        },
      },
    },
    async function(request, reply) {
      const formData = request.body;

      await app.job.dispatch('InsertNotionPage', formData);
    },
  );
};
