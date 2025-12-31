import { SubjectModel, type Subject } from '@/models/Subject.js';
import { listSubjectsSchema, searchSubjectSchema } from '@/schemas/entities/subjects.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { rawSubjectsReviews, type Distribution } from './service.js';
import { TeacherModel } from '@/models/Teacher.js';
import { Types } from 'mongoose';

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

    const validSubjectId = new Types.ObjectId(subjectId);
    const stats = await rawSubjectsReviews(validSubjectId);
    -ignore lint/complexity/noForEach: <explanation>
    stats.forEach((s) => {
      s.cr_medio = s.numeric / s.amount;
    });

    const generalDistribution = stats
      .flatMap((stat) => stat.distribution)
      .reduce(
        (acc, dist) => {
          if (!acc[dist.conceito]) {
            acc[dist.conceito] = [];
          }
          acc[dist.conceito].push(dist);
          return acc;
        },
        {} as Record<string, Distribution[]>,
      );

    const generalDistributions = Object.entries(generalDistribution).map(([key, value]) =>
      getMean(value, key),
    );

    const subject = await SubjectModel.findOne({
      _id: validSubjectId,
    }).lean();
    const teacher = await TeacherModel.populate(stats, 'teacher');
    const resp = {
      subject: subject as NonNullable<Subject>,
      general: {
        ...getMean(generalDistributions),
        distribution: generalDistributions,
      },
      specific: teacher,
    };

    subjectsCache.set(cacheKey, resp);

    return resp;
  });
};

function getMean(value: Distribution[], key?: string): Distribution {
  const count = value.reduce((sum, v) => sum + v.count, 0);
  const amount = value.reduce((sum, v) => sum + v.amount, 0);
  const simpleSum = value
    .filter((v) => v.cr_medio != null)
    .reduce((sum, v) => sum + v.amount * v.cr_medio, 0);

  return {
    conceito: key as Distribution['conceito'],
    cr_medio: simpleSum / amount,
    cr_professor: value.reduce((sum, v) => sum + v.numericWeight, 0) / amount,
    count,
    amount: amount,
    numeric: value.reduce((sum, v) => sum + v.numeric, 0),
    numericWeight: value.reduce((sum, v) => sum + v.numericWeight, 0),
    weight: 0, // Added to match the Distribution interface
  };
}

export default plugin;
