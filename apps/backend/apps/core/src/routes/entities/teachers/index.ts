import { type Teacher, TeacherModel } from '@/models/Teacher.js';
import {
  createTeachersSchema,
  listTeachersSchema,
  searchTeacherSchema,
  updateTeacherSchema,
} from '@/schemas/entities/teachers.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { camelCase, startCase } from 'lodash-es';
import { Types } from 'mongoose';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/', { schema: listTeachersSchema }, async () => {
    const teachers = await TeacherModel.find({}).lean<Teacher[]>();

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

      const teacherWithAlias = await TeacherModel.findOneAndUpdate(
        { _id: new Types.ObjectId(teacherId) },
        { alias },
        { new: true },
      ).lean<Teacher>();

      return teacherWithAlias;
    },
  );

  app.get('/search', async (request) => {
    const { q } = request.query;

    const [searchResults] = await TeacherModel.aggregate<{
      total: number;
      data: Array<{
        name: string;
        alias: string[];
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
