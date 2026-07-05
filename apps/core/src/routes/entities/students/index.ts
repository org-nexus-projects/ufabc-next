import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import { ComponentModel } from '@/models/Component.js';
import {
  listMatriculaStudent,
  listStudentSchema,
  listStudentsStatsComponents,
  updateStudentSchema,
} from '@/schemas/entities/students.js';
import type { MatriculaStudent } from '@/schemas/entities/students.js';

import {
  getAllCourses,
  getComponentsStudentsStats,
  getStudent,
  update,
} from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get(
    '/stats/components',
    { schema: listStudentsStatsComponents },
    async (request, reply) => {
      const { season } = request.query;

      const isPrevious = await ComponentModel.countDocuments({
        before_kick: { $exists: true, $ne: [] },
        season,
      });

      const dataKey = isPrevious ? '$before_kick' : '$alunos_matriculados';
      const statusAggregate = await getComponentsStudentsStats(season, dataKey);

      return statusAggregate;
    }
  );

  app.get('/courses', async () => {
    const allStudentsCourses = await getAllCourses();
    return allStudentsCourses;
  });

  app.get('/', { schema: listStudentSchema }, async ({ headers }, reply) => {
    const login = headers['uf-login'];
    const ra = Number(headers.ra as string);

    if (!login || !ra) {
      return await reply.badRequest('Missing required params');
    }

    const student = await getStudent({ login, ra });

    if (!student) {
      return await reply.notFound('Student not found');
    }

    return {
      graduations: student.cursos.map((c) => ({
        name: c.nome_curso,
        courseId: c.id_curso,
        shift: c.turno,
        cp: c.cp,
        ca: c.ca,
        cr: c.cr,
        affinity: c.ind_afinidade,
      })),
      login: student.login,
      studentId: student.aluno_id,
      updatedAt: student.updatedAt.toISOString(),
    };
  });

  app.get(
    '/student',
    { schema: listMatriculaStudent },
    async (request, reply) => {
      const login = request.headers['uf-login'];

      if (!login) {
        return await reply.badRequest('Missing required params');
      }

      const student = await getStudent({ login });

      if (!student) {
        return await reply.notFound('Student not found');
      }

      const matriculaStudent = {
        graduations: student.cursos.map((c) => ({
          courseId: c.id_curso,
          name: c.nome_curso,
          shift: c.turno,
          affinity: c.ind_afinidade,
          cp: c.cp ?? 0,
          cr: c.cr ?? 0,
          ca: c.ca ?? 0,
        })),
        studentId: student.aluno_id,
        updatedAt: student.updatedAt.toISOString(),
      } satisfies MatriculaStudent;

      return matriculaStudent;
    }
  );

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
