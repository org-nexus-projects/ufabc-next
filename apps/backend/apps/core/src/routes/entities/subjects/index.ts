import { SubjectModel } from '@/models/Subject.js';
import {
  listSubjectsSchema,
  searchSubjectSchema,
} from '@/schemas/entities/subjects.js';
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

  app.get('/search', { schema: searchSubjectSchema }, async (request) => {
    const { q } = request.query;

    const [searchResults] = await SubjectModel.aggregate<{
      total: number;
      data: Array<{
        name: string;
        search: string | null;
        creditos: number;
      }>;
    }>([
      {
        $match: { name: new RegExp(q, 'gi') },
      },
      {
        $facet: {
          total: [{ $count: 'total' }],
          data: [{ $limit: 10 }],
        },
      },
      {
        $addFields: {
          total: { $ifNull: [{ $arrayElemAt: ['$total.total', 0] }, 0] },
        },
      },
      {
        $project: {
          total: 1,
          data: 1,
        },
      },
    ]);

    return searchResults;
  });
};

export default plugin;
