import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import { updateStudentSchema } from '@/schemas/entities/students.js';

import { update } from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.put('/', { schema: updateStudentSchema }, async (request, reply) => {
    const { login, ra, studentId, graduationId } = request.body;

    const updatedStudent = await update({
      graduationId,
      login,
      ra,
      studentId,
    });

    if (!updatedStudent) {
      return await reply.notFound('Could not find student');
    }

    return updatedStudent;
  });
};

export default plugin;
