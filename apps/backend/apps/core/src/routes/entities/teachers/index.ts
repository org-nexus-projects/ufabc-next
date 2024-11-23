import { type Teacher, TeacherModel } from '@/models/Teacher.js';
import { createTeachersSchema, listTeachersSchema, updateTeacherSchema } from '@/schemas/entities/teachers.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { Types } from 'mongoose';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/', { schema: listTeachersSchema }, async () => {
    const teachers = await TeacherModel.find({}).lean<Teacher[]>()

    return teachers;
  })
  
  app.post('/', { schema: createTeachersSchema },async (request, reply) => {
    const { names } = request.body;

    if (Array.isArray(names)) {
      const toInsert = names.map((name) => ({ name }));
      const insertedTeachers = await TeacherModel.create(toInsert);
      return insertedTeachers;
    }

    const insertedTeacher = await TeacherModel.create({ names });
    return insertedTeacher;
  });

  app.put('/:teacherId', {schema: updateTeacherSchema}, async (request, reply) => {
    const { teacherId } = request.params;
    const { alias } = request.body;

    if (!teacherId) {
      return reply.badRequest('Missing teacherId');
    }

    const teacherWithAlias = await TeacherModel.findOneAndUpdate(
      {_id: new Types.ObjectId(teacherId)},
      { alias },
      { new: true }
    ).lean<Teacher>();

    return teacherWithAlias;
  })
};

export default plugin;
