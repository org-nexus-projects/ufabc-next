import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import { Types } from 'mongoose';

import { SubjectModel } from '@/models/Subject.js';
import {
  listSubjectsSchema,
  searchSubjectSchema,
} from '@/schemas/entities/subjects.js';

import { buildSubjectReviews } from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  const subjectsCache = app.cache<{}>();
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
        _id: string;
        search: string | null;
        creditos: number;
      }>;
    }>([
      {
        $match: { search: new RegExp(q, 'gi') },
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

  app.get('/reviews/:subjectId', async (request, reply) => {
    const { subjectId } = request.params as { subjectId: string };

    if (!subjectId) {
      return reply.badRequest('Missing SubjectId');
    }

    const cacheKey = `reviews:${subjectId.toString()}`;
    const cached = subjectsCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const resp = await buildSubjectReviews(new Types.ObjectId(subjectId));

    subjectsCache.set(cacheKey, resp);

    return resp;
  });
};

export default plugin;
