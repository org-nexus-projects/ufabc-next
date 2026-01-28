import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { z } from 'zod';

import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { sigaaSession } from '@/hooks/sigaa-session.js';
import { matriculaSession } from '@/hooks/matricula-session.js';
import { currentQuad } from '@next/common';
import { StudentModel } from '@/models/Student.js';

const CACHE_TTL = 1000 * 60 * 60 * 24; // 1 day

export const studentsController: FastifyPluginAsyncZod = async (app) => {
  
  app.route({
    method: 'PUT',
    url: '/students',
    schema: {
      headers: z.object({
        'session-id': z.string(),
      }),
      body: z.object({
        login: z.string(),
        studentId: z.number(),
        graduationId: z.number()
      }),
      response: {
        200: z.object({
          message: z.string()
        })
      }
    },
    preHandler: [matriculaSession],
    handler: async (request, reply) => {
      const season = currentQuad()
      const { login, studentId, graduationId } = request.body
      
      await StudentModel.findOneAndUpdate({
        season,
        login,
      }, {
        $set: {
          aluno_id: studentId,
          'cursos.$[].id_curso': graduationId
        }
      })
      
      return reply.send({ message: 'Student updated successfully' })
    }
  })

  app.route({
    method: 'GET',
    url: '/students',
    schema: {
      headers: z.object({
        'session-id': z.string(),
        login: z.string(),
      }),
      response: {
       200: z.object({
         ra: z.number(),
         graduations: z.object({
           name: z.string(),
           shift: z.enum(['Noturno','Matutino','noturno', 'matutino', 'n', 'm']),
           affinity: z.number().nullable(),
           cp: z.number().optional().nullable(),
           cr: z.number().optional().nullable(),
           ca: z.number().optional().nullable()
         }).array()
       })
      },
    },
    preHandler: [matriculaSession],
    handler: async (request, reply) => {
      const season = currentQuad()
      const [student] = await StudentModel.find({
        season,
        login: request.headers.login
      })
      
      if (!student) {
        return reply.notFound();
      }
      
      const response = student.cursos.map(graduation => ({
        name: graduation.nome_curso,
        shift: graduation.turno,
        affinity: graduation.ind_afinidade,
        cp: graduation.cp,
        cr: graduation.cr,
        ca: graduation.ca
      }))
      
      return reply.send({
        ra: student.ra,
        graduations: response
      })
    }
  })
  
  
  app.route({
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
    handler: async (request, reply) => {
      const connector = new UfabcParserConnector(request.id);
      const { ra, login } = request.body;
      const { sessionId, viewId } = request.sigaaSession;
      const cacheKey = `http:students:sigaa:${ra}`;

      const cached = await app.redis.get(cacheKey);
      if (cached) {
        app.log.debug({ cacheKey }, 'Student already synced');
        return reply.status(202).send({
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
              status: 'created',
              metadata: {
                login,
              },
            },
          ],
        });
      }

      await connector.syncStudent({
        sessionId,
        viewId,
        requesterKey: app.config.UFABC_PARSER_REQUESTER_KEY,
      });

      await studentSync.transition('awaiting', {
        source: 'sigaa',
        login,
      });
      await app.redis.set(cacheKey, login, 'PX', CACHE_TTL);

      return reply.status(202).send({
        status: 'success',
      });
    },
  });
};

export default studentsController;
