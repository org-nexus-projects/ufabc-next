import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { httpErrors } from '@fastify/sensible';
import { Types } from 'mongoose';
import { z } from 'zod';

import { legacyJwtHook } from '@/hooks/legacy-auth.js';
import {
  centralErrorHandler,
  schemaErrorFormatter,
} from '@/plugins/v2/error-handler.js';
import { SubjectModel } from '@/models/Subject.js';
import { buildSubjectReviews } from '@/routes/entities/subjects/service.js';
import {
  listSubjectsSchema,
  paginatedSubjectsSchema,
  searchSubjectSchema,
  searchSubjectsResponseSchema,
} from '@/schemas/entities/subjects.js';

const tags = ['subjects'];

const subjectsRoutes: FastifyPluginAsyncZod = async (scoped) => {
  scoped.setErrorHandler(centralErrorHandler);
  scoped.setSchemaErrorFormatter(schemaErrorFormatter);

  const subjectsCache = scoped.cache<{}>();

  scoped.route({
    handler: async (request, reply) => {
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

      return await reply.status(200).send({
        total,
        pages,
        data: results,
      });
    },
    method: 'GET',
    onRequest: legacyJwtHook,
    schema: {
      querystring: listSubjectsSchema.querystring,
      response: {
        200: paginatedSubjectsSchema,
      },
      tags,
    },
    url: '/',
  });

  scoped.route({
    handler: async (request, reply) => {
      const { q } = request.query;

      const [searchResults] = await SubjectModel.aggregate<
        z.infer<typeof searchSubjectsResponseSchema>
      >([
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

      return await reply.status(200).send(searchResults);
    },
    method: 'GET',
    onRequest: legacyJwtHook,
    schema: {
      querystring: searchSubjectSchema.querystring,
      response: {
        200: searchSubjectsResponseSchema,
      },
      tags,
    },
    url: '/search',
  });

  scoped.route({
    handler: async (request, reply) => {
      const { subjectId } = request.params;

      if (!subjectId) {
        throw httpErrors.badRequest('Missing SubjectId');
      }

      const cacheKey = `reviews:${subjectId.toString()}`;
      const cached = subjectsCache.get(cacheKey);

      if (cached) {
        return await reply.status(200).send(cached);
      }

      const resp = await buildSubjectReviews(new Types.ObjectId(subjectId));

      subjectsCache.set(cacheKey, resp);

      return await reply.status(200).send(resp);
    },
    method: 'GET',
    schema: {
      params: z.object({
        subjectId: z.string(),
      }),
      tags,
    },
    url: '/reviews/:subjectId',
  });
};

export const subjectsController: FastifyPluginAsyncZod = async (app) => {
  await app.register(subjectsRoutes, { prefix: '/entities/subjects' });
};
