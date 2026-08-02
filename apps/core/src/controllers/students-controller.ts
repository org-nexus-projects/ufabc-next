import { currentQuad } from '@next/utils';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { matriculaSession } from '@/hooks/matricula-session.js';
import { sigaaSession } from '@/hooks/sigaa-session.js';
import { StudentModel } from '@/models/Student.js';
import { findRaByLogin } from '@/utils/resolve-student-ra.js';
import { syncStudentFromSigaa } from '@/services/sigaa-student-sync.js';

const CACHE_TTL = 1000 * 60 * 60 * 24; // 1 day

export const studentsController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    handler: async (request, reply) => {
      const season = currentQuad();
      const { login, studentId, graduationId } = request.body;

      const ra = await findRaByLogin(login);

      if (!ra) {
        return await reply.notFound();
      }

      await StudentModel.findOneAndUpdate(
        {
          ra,
          season,
        },
        {
          $set: {
            aluno_id: studentId,
            'cursos.$[].id_curso': graduationId,
          },
        }
      );

      return await reply.send({ message: 'Student updated successfully' });
    },
    method: 'PUT',
    preHandler: [matriculaSession],
    schema: {
      body: z.object({
        graduationId: z.number(),
        login: z.string(),
        studentId: z.number(),
      }),
      headers: z.object({
        'session-id': z.string(),
      }),
      response: {
        200: z.object({
          message: z.string(),
        }),
      },
    },
    url: '/students',
  });

  app.route({
    handler: async (request, reply) => {
      const season = currentQuad();
      const [student] = await StudentModel.find({
        login: request.headers.login,
        season,
      });

      if (!student) {
        return await reply.notFound();
      }

      const response = student.cursos.map((graduation) => ({
        affinity: graduation.ind_afinidade,
        ca: graduation.ca,
        cp: graduation.cp,
        cr: graduation.cr,
        name: graduation.nome_curso,
        shift: graduation.turno,
      }));

      return await reply.send({
        graduations: response,
        ra: student.ra,
      });
    },
    method: 'GET',
    preHandler: [matriculaSession],
    schema: {
      headers: z.object({
        login: z.string(),
        'session-id': z.string(),
      }),
      response: {
        200: z.object({
          graduations: z
            .object({
              affinity: z.number().nullable(),
              ca: z.number().optional().nullable(),
              cp: z.number().optional().nullable(),
              cr: z.number().optional().nullable(),
              name: z.string(),
              shift: z.enum([
                'Noturno',
                'Matutino',
                'noturno',
                'matutino',
                'n',
                'm',
              ]),
            })
            .array(),
          ra: z.number(),
        }),
      },
    },
    url: '/students',
  });

  app.route({
    handler: async (request, reply) => {
      const { ra, login } = request.body;
      const { sessionId, viewId } = request.sigaaSession;

      const result = await syncStudentFromSigaa(
        app,
        { ra, login },
        { sessionId, viewId },
        request.id
      );

      if (result.status === 'not_found') {
        return reply.notFound(result.message);
      }

      if (result.status === 'conflict') {
        return reply.conflict(result.message);
      }

      if (result.status === 'cached') {
        app.log.debug({ cacheKey: result.cacheKey }, 'Student already synced');
        return reply.status(202).send({ status: 'cached' });
      }

      return reply.status(202).send(result);
    },
    method: 'POST',
    url: '/students/sigaa',
    schema: {
      headers: z.object({
        'session-id': z.string(),
        'view-id': z.string(),
      }),
      body: z.object({
        ra: z.number(),
        login: z.string(),
      }),
      response: {
        202: z.object({
          status: z.string(),
          data: z.any(),
        }),
      },
    },
    preHandler: [sigaaSession],
  });
};

export default studentsController;
