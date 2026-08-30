import { currentQuad } from '@next/utils';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { matriculaSession } from '@/hooks/matricula-session.js';
import { sigaaSession } from '@/hooks/sigaa-session.js';
import { StudentModel } from '@/models/Student.js';
import { findRaByLogin } from '@/utils/resolve-student-ra.js';

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
      body: z.object({
        login: z.string(),
        ra: z.number(),
      }),
      headers: z.object({
        'session-id': z.string(),
        'view-id': z.string(),
      }),
      response: {
        202: z.object({
          data: z.any(),
          status: z.string(),
        }),
      },
    },
    url: '/students/sigaa',
  });
};

export default studentsController;
