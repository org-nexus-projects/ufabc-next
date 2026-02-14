import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { z } from 'zod';

import { MoodleConnector } from '@/connectors/moodle.js';
import { JOB_NAMES } from '@/constants.js';
import { moodleSession } from '@/hooks/moodle-session.js';
import { getComponentArchives } from '@/services/components-service.js';
import { ComponentModel } from '@/models/Component.js';

const moodleConnector = new MoodleConnector();

const componentsController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/components/archives',
    preHandler: [moodleSession],
    schema: {
      response: {
        202: z.object({
          status: z.string(),
        }),
      },
      headers: z.object({
        'session-id': z.string(),
        'sess-key': z.string(),
      }),
    },
    handler: async (request, reply) => {
      const session = request.requestContext.get('moodleSession')!;
      const hasLock = await request.acquireLock(session.sessionId, '24h');

      if (!hasLock) {
        request.log.debug(
          { sessionId: session.sessionId },
          'Archives already processing'
        );
        return reply.status(202).send({ status: 'success' });
      }

      try {
        const courses = await moodleConnector.getComponents(
          session.sessionId,
          session.sessKey
        );

        const componentArchives = await getComponentArchives(courses[0]);
        if (componentArchives.error || !componentArchives.data) {
          await request.releaseLock(session.sessionId);
          return reply.badRequest(componentArchives.error ?? 'No data');
        }

        await app.manager.dispatch(JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING, {
          component: componentArchives.data,
          globalTraceId: request.id,
          session,
        });

        return reply.status(202).send({
          status: 'success',
        });
      } catch (error) {
        request.log.error(error, 'Error getting archives');
        await request.releaseLock(session.sessionId);
        return reply.internalServerError('Error getting archives');
      }
    },
  });

  app.route({
    method: 'GET',
    url: '/components/archives',
    preHandler: [moodleSession],
    schema: {
      response: {
        200: z.object({
          status: z.string(),
          data: z.any().array(),
        }),
      },
    },
    handler: async (request, reply) => {
      const session = request.requestContext.get('moodleSession')!;
      const components = await moodleConnector.getComponents(
        session.sessionId,
        session.sessKey
      );
      return reply.status(200).send({
        status: 'success',
        data: components,
      });
    },
  });

  app.route({
    method: 'GET',
    url: '/components/archives/uploads',
    handler: async (request, reply) => {
      const uploads = await app.aws.s3.list(app.config.AWS_BUCKET);
      return reply.status(200).send({
        status: 'success',
        data: uploads,
      });
    },
  });

  app.route({
    method: 'GET',
    url: '/components/pending-group-url',
    schema: {
      querystring: z.object({
        season: z.string(),
      }),
      response: {
        200: z.object({
          status: z.string(),
          data: z.any().array(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { season } = request.query;

      const requested = await ComponentModel.aggregate([
        {
          $match: {
            season,
            $or: [
              { groupURL: null },
              { groupURL: { $exists: false } }
            ]
          }
        },
        {
          $lookup: {
            from: "teachers",
            localField: "teoria",
            foreignField: "_id",
            as: "teoriaTeacher"
          }
        },
        {
          $lookup: {
            from: "teachers",
            localField: "pratica",
            foreignField: "_id",
            as: "praticaTeacher"
          }
        },
        {

          $addFields: {
            amount_studentsId: {
              $size: {
                $ifNull: ["$alunos_matriculados", []]
              }
            }
          }
        },
        {
          $group: {
            _id: "$codigo",
            // This creates a unique set of all student IDs across all components in the group
            allStudentsInGroup: { $addToSet: "$alunos_matriculados" },
            components: {
              $push: {
                disciplina_id: "$disciplina_id",
                amount_studentsId: "$$ROOT.quantidade_alunos_matriculados",
                nome: "$nome",
                turma: "$turma",
                vagas: "$vagas",
                uf_cod_turma: "$uf_cod_turma",
                // Extract the teacher name immediately during the push
                teoria: { $arrayElemAt: ["$teoriaTeacher.name", 0] },
                pratica: { $arrayElemAt: ["$praticaTeacher.name", 0] }
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            codigo: "$_id",
            // $reduce transforms the array of arrays into one flat unique array to count unique students
            amount_subject_students: {
              $size: {
                $reduce: {
                  input: "$allStudentsInGroup",
                  initialValue: [],
                  in: { $setUnion: ["$$value", "$$this"] }
                }
              }
            },
            components: 1
          }
        },
        { $sort: { amount_subject_students: -1 } }

      ]);
      return reply.status(200).send({
        status: 'success',
        data: requested,
      });
    },
  });
};

export default componentsController;
