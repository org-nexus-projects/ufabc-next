import { SubjectModel } from '@/models/Subject.js';
import { listSubjectsSchema } from '@/schemas/entities/subjects.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/', { schema: listSubjectsSchema }, async (request, reply) => {
    const { limit, page } = request.query;

    const [total, subjects] = await Promise.all([
      SubjectModel.countDocuments(),
      SubjectModel.find()
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
    ]);

    const pages = Math.ceil(total / limit);
    const results = subjects.map((s) => ({
      credits: s.creditos,
      name: s.name,
    }));

    return {
      total,
      pages,
      data: results,
    };
  });
};

export default plugin;
