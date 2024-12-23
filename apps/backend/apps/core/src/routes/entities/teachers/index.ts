import { TeacherModel } from '@/models/Teacher.js';
import {
  createTeachersSchema,
  listTeachersSchema,
  searchTeacherSchema,
  updateTeacherSchema,
} from '@/schemas/entities/teachers.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { Types } from 'mongoose';
import {
  findAndUpdate,
  findOne,
  listAll,
  populateWithSubject,
  rawReviews,
  searchMany,
} from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  const teachersCache = app.cache<{}>();

  app.get('/', { schema: listTeachersSchema }, async () => {
    const teachers = await listAll();
    return teachers;
  });

  app.post('/', { schema: createTeachersSchema }, async (request, reply) => {
    const { names } = request.body;

    if (Array.isArray(names)) {
      const toInsert = names.map((name) => ({ name }));
      const insertedTeachers = await TeacherModel.create(toInsert);
      return insertedTeachers;
    }

    const insertedTeacher = await TeacherModel.create({ names });
    return insertedTeacher;
  });

  app.put(
    '/:teacherId',
    { schema: updateTeacherSchema },
    async (request, reply) => {
      const { teacherId } = request.params;
      const { alias } = request.body;

      if (!teacherId) {
        return reply.badRequest('Missing teacherId');
      }

      const updatedTeacher = await findAndUpdate(teacherId, alias);

      if (!updatedTeacher) {
        return reply.badRequest('Teacher not found');
      }

      return updatedTeacher;
    },
  );

  app.get('/search', { schema: searchTeacherSchema }, async (request) => {
    const { q } = request.query;

    const [searchResults] = await searchMany(q);

    return searchResults;
  });

  app.get('/reviews/:teacherId', async (request, reply) => {
    const { teacherId } = request.params as { teacherId: string };

    if (!teacherId) {
      return reply.badRequest('Missing SubjectId');
    }

    const cacheKey = `reviews:${teacherId.toString()}`;
    const cached = teachersCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const validTeacherId = new Types.ObjectId(teacherId);
    const stats = await rawReviews(validTeacherId);
    // biome-ignore lint/complexity/noForEach: <explanation>
    stats.forEach((s) => {
      s.cr_medio = s.numeric / s.amount;
    });

    const generalDistribution = stats
      .flatMap((stat) => stat.distribution)
      .reduce((acc, dist) => {
        if (!acc[dist.conceito]) {
          acc[dist.conceito] = [];
        }
        acc[dist.conceito].push(dist);
        return acc;
      }, {});

    const generalDistributions = Object.entries(generalDistribution).map(
      ([key, value]) => getMean(value as any, key),
    );

    const teacher = await findOne(teacherId);
    const populatedSubject = await populateWithSubject(stats);
    const resp = {
      teacher,
      general: {
        ...getMean(generalDistributions),
        distribution: generalDistributions,
      },
      specific: populatedSubject,
    };

    teachersCache.set(cacheKey, resp);

    return resp;
  });
};

function getMean(value: any[], key?: string): any {
  const count = value.reduce((sum, v) => sum + v.count, 0);
  const amount = value.reduce((sum, v) => sum + v.amount, 0);
  const simpleSum = value
    .filter((v) => v.cr_medio != null)
    .reduce((sum, v) => sum + v.amount * v.cr_medio, 0);

  return {
    conceito: key,
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
