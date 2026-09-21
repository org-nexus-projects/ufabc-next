import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { httpErrors } from '@fastify/sensible';

import { legacyExtensionHook } from '@/hooks/legacy-auth.js';
import { ComponentModel } from '@/models/Component.js';
import {
  centralErrorHandler,
  schemaErrorFormatter,
} from '@/plugins/v2/error-handler.js';
import {
  getAllCourses,
  getComponentsStudentsStats,
  getStudent,
  update,
} from '@/routes/entities/students/service.js';
import type { MatriculaStudent } from '@/schemas/entities/students.js';

import {
  listAllCoursesSchema,
  listMatriculaStudent,
  listStudentSchema,
  listStudentsStatsComponents,
  updateStudentSchema,
} from '@/schemas/entities/students.js';

const tags = ['Students'];

const studentsRoutes: FastifyPluginAsyncZod = async (scoped) => {
  scoped.setErrorHandler(centralErrorHandler);
  scoped.setSchemaErrorFormatter(schemaErrorFormatter);

  scoped.route({
    handler: async (request, reply) => {
      const { season } = request.query;

      const isPrevious = await ComponentModel.countDocuments({
        before_kick: { $exists: true, $ne: [] },
        season,
      });

      const dataKey = isPrevious ? '$before_kick' : '$alunos_matriculados';

      return await reply.status(200).send(await getComponentsStudentsStats(season, dataKey));
    },
    method: 'GET',
    schema: {
      querystring: listStudentsStatsComponents.querystring,
      response: {
        200: listStudentsStatsComponents.response[200].content[
          'application/json'
        ].schema,
      },
      tags,
    },
    url: '/stats/components',
  });

  scoped.route({
    handler: async (_request, reply) =>
      await reply.status(200).send(await getAllCourses()),
    method: 'GET',
    schema: {
      querystring: listAllCoursesSchema.querystring,
      tags,
    },
    url: '/courses',
  });

  scoped.route({
    handler: async ({ headers }, reply) => {
      const login = headers['uf-login'];
      const ra = Number(headers.ra as string);

      if (!login || !ra) {
        throw httpErrors.badRequest('Missing required params');
      }

      const student = await getStudent({ login, ra });

      if (!student) {
        throw httpErrors.notFound('Student not found');
      }

      return await reply.status(200).send({
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
      });
    },
    method: 'GET',
    onRequest: legacyExtensionHook,
    schema: {
      response: {
        200: listStudentSchema.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/',
  });

  scoped.route({
    handler: async (request, reply) => {
      const login = request.headers['uf-login'];

      if (!login) {
        throw httpErrors.badRequest('Missing required params');
      }

      const student = await getStudent({ login });

      if (!student) {
        throw httpErrors.notFound('Student not found');
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

      return await reply.status(200).send(matriculaStudent);
    },
    method: 'GET',
    onRequest: legacyExtensionHook,
    schema: {
      headers: listMatriculaStudent.headers,
      querystring: listMatriculaStudent.querystring,
      response: {
        200: listMatriculaStudent.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/student',
  });

  scoped.route({
    handler: async (request, reply) => {
      const { login, ra, studentId, graduationId } = request.body;

      const updatedStudent = await update({
        graduationId,
        login,
        ra,
        studentId,
      });

      if (!updatedStudent) {
        throw httpErrors.notFound('Could not find student');
      }

      return await reply.status(200).send(updatedStudent);
    },
    method: 'PUT',
    onRequest: legacyExtensionHook,
    schema: {
      body: updateStudentSchema.body,
      response: {
        200: updateStudentSchema.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/',
  });
};

export const studentsEntitiesController: FastifyPluginAsyncZod = async (
  app
) => {
  await app.register(studentsRoutes, { prefix: '/entities/students' });
};
