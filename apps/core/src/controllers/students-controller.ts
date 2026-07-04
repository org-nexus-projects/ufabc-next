import {
  matriculaStudentSchema,
  messageResponseSchema,
  statusResponseSchema,
  syncSigaaStudentBodySchema,
  type MatriculaStudent,
  updateMatriculaStudentBodySchema,
} from '@next/connectors/schemas/next-api';
import { currentQuad } from '@next/utils';
import { type FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { matriculaSession } from '@/hooks/matricula-session.js';
import { sigaaSession } from '@/hooks/sigaa-session.js';
import { StudentModel } from '@/models/Student.js';

function normalizeShift(turno: string): 'Noturno' | 'Matutino' {
  if (turno === 'Matutino' || turno === 'matutino' || turno === 'm') {
    return 'Matutino';
  }
  return 'Noturno';
}

// 1 day
const CACHE_TTL = 1000 * 60 * 60 * 24;

export const studentsController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    handler: async (request, reply) => {
      const season = currentQuad();
      const { login, studentId, graduationId } = request.body;

      await StudentModel.findOneAndUpdate(
        {
          login,
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
      body: updateMatriculaStudentBodySchema,
      headers: z.object({
        'session-id': z.string(),
      }),
      response: {
        200: messageResponseSchema,
      },
    },
    url: '/students',
  });

  app.route({
    handler: async (request, reply) => {
      const season = currentQuad();
      const studentQuery = request.user?.ra
        ? { ra: request.user.ra, season }
        : { login: request.headers.login, season };
      const [student] = await StudentModel.find(studentQuery);

      if (student === null) {
        return await reply.notFound();
      }

      const response = student.cursos.map((graduation) => ({
        affinity: graduation.ind_afinidade ?? 0,
        ca: graduation.ca ?? 0,
        courseId: graduation.id_curso ?? 0,
        cp: graduation.cp ?? 0,
        cr: graduation.cr ?? 0,
        name: graduation.nome_curso,
        shift: normalizeShift(graduation.turno),
      })) satisfies MatriculaStudent['graduations'];

      const fullStudent: MatriculaStudent = {
        graduations: response,
        login: student.login,
        ra: student.ra,
        studentId: student.aluno_id ?? 0,
        updatedAt: student.updatedAt.toISOString(),
      };

      return await reply.send(fullStudent);
    },
    method: 'GET',
    preHandler: [matriculaSession],
    schema: {
      headers: z.object({
        authorization: z.string().optional(),
        login: z.string().optional(),
        'session-id': z.string().optional(),
      }),
      response: {
        200: matriculaStudentSchema,
      },
    },
    url: '/students',
  });

  app.route({
    handler: async (request, reply) => {
      const connector = new UfabcParserConnector(request.id);
      const { ra, login } = request.body;
      const { sessionId, viewId } = request.sigaaSession;
      const cacheKey = `http:students:sigaa:${ra}`;

      const cached = await app.redis.get(cacheKey);
      if (cached) {
        app.log.debug({ cacheKey }, 'Student already synced');
        return await reply.status(202).send({
          status: 'cached',
        });
      }

      let studentSync = await app.db.StudentSync.findOne({ ra: String(ra) });
      if (!studentSync) {
        studentSync = await app.db.StudentSync.create({
          ra: String(ra),
          status: 'created',
          timeline: [
            {
              metadata: {
                login,
              },
              status: 'created',
            },
          ],
        });
      }

      await connector.syncStudent({
        requesterKey: app.config.UFABC_PARSER_REQUESTER_KEY,
        sessionId,
        viewId,
      });

      await studentSync.transition('awaiting', {
        login,
        source: 'sigaa',
      });
      await app.redis.set(cacheKey, login, 'PX', CACHE_TTL);

      return await reply.status(202).send({
        status: 'success',
      });
    },
    method: 'POST',
    preHandler: [sigaaSession],
    schema: {
      body: syncSigaaStudentBodySchema,
      headers: z.object({
        'session-id': z.string(),
        'view-id': z.string(),
      }),
      response: {
        202: statusResponseSchema,
      },
    },
    url: '/students/sigaa',
  });
};

export default studentsController;
