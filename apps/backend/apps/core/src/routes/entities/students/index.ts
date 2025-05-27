import { ComponentModel } from '@/models/Component.js';
import {
  listMatriculaStudent,
  listStudentSchema,
  listStudentsStatsComponents,
  type MatriculaStudent,
  updateStudentSchema,
} from '@/schemas/entities/students.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
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
        season,
        before_kick: { $exists: true, $ne: [] },
      });

      const dataKey = isPrevious ? '$before_kick' : '$alunos_matriculados';
      const statusAggregate = await getComponentsStudentsStats(season, dataKey);

      return statusAggregate;
    },
  );

  app.get('/courses', async () => {
    const allStudentsCourses = await getAllCourses();
    return allStudentsCourses;
  });

  app.get('/', { schema: listStudentSchema }, async ({ headers }, reply) => {
    const login = headers['uf-login'];
    const ra = headers.ra;

    if (!login || !ra) {
      return reply.badRequest('Missing required params');
    }

    const student = await getStudent({ ra, login });

    if (!student) {
      return reply.notFound('Student not found');
    }

    return {
      studentId: student.aluno_id,
      login: student.login,
      graduations: student.cursos.map((c) => ({
        name: c.nome_curso,
        courseId: c.id_curso,
        shift: c.turno,
        cp: c.cp,
        ca: c.ca,
        cr: c.cr,
        affinity: c.ind_afinidade,
      })),
      updatedAt: student.updatedAt.toISOString(),
    };
  });

  app.get(
    '/student',
    { schema: listMatriculaStudent },
    async (request, reply) => {
      const login = request.headers['uf-login'];

      if (!login) {
        return reply.badRequest('Missing required params');
      }

      const student = await getStudent({ login });

      if (!student) {
        return reply.notFound('Student not found');
      }

      const matriculaStudent = {
        studentId: student.aluno_id,
        graduations: student.cursos.map((c) => ({
          courseId: c.id_curso,
          name: c.nome_curso,
          shift: c.turno,
          affinity: c.ind_afinidade,
          cp: c.cp ?? 0,
          cr: c.cr ?? 0,
          ca: c.ca ?? 0,
        })),
        updatedAt: student.updatedAt.toISOString(),
      } satisfies MatriculaStudent;

      return matriculaStudent;
    },
  );

  app.put('/', { schema: updateStudentSchema }, async (request, reply) => {
    const { login, ra, studentId, graduationId } = request.body;

    const updatedStudent = await update({
      login,
      ra,
      studentId,
      graduationId,
    });

    if (!updatedStudent) {
      return reply.notFound('Could not find student');
    }

    return updatedStudent;
  });
};

export default plugin;
