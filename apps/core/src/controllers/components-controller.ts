import { currentQuad } from '@next/utils';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { AIProxyConnector } from '@/connectors/ai-proxy.js';
import { MoodleConnector } from '@/connectors/moodle.js';
import { JOB_NAMES } from '@/constants.js';
import { jwtVerifyHook } from '@/hooks/jwt-verify.js';
import { extensionSession } from '@/hooks/extension-session.js';
import { ComponentModel } from '@/models/Component.js';
import { ComponentMetadataModel } from '@/models/ComponentMetadata.js';
import type {
  ListComponent,
  PopulatedComponent,
} from '@/schemas/v2/components.js';
import { listComponentsSchema } from '@/schemas/v2/components.js';
import { getComponentArchives } from '@/services/components-service.js';

const moodleConnector = new MoodleConnector();

const componentsController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    method: 'POST',
    url: '/components/archives',
    preHandler: [extensionSession('moodle')],
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
      const session = request.requestContext.get('extensionSession')! as { sessionId: string; sessKey: string };
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
    handler: async (request, reply) => {
      const session = request.requestContext.get('extensionSession')! as { sessionId: string; sessKey: string };
      const components = await moodleConnector.getComponents(
        session.sessionId,
        session.sessKey
      );
      return reply.status(200).send({
        status: 'success',
        data: components,
      });
    },
    method: 'GET',
    preHandler: [extensionSession('moodle')],
    schema: {
      response: {
        200: z.object({
          status: z.string(),
          data: z.any().array(),
        }),
      },
    },
    url: '/components/archives',
  });

  app.route({
    handler: async (_request, reply) => {
      const uploads = await app.aws.s3.list(app.config.AWS_BUCKET);
      return reply.status(200).send({
        status: 'success',
        data: uploads,
      });
    },
    method: 'GET',
    url: '/components/archives/uploads',
  });

  app.route({
    handler: async (request, reply) => {
      const { season } = request.query;

      const requested = await ComponentModel.aggregate([
        {
          $match: {
            season,
            $or: [{ groupURL: null }, { groupURL: { $exists: false } }],
          },
        },
        {
          $lookup: {
            from: 'teachers',
            localField: 'teoria',
            foreignField: '_id',
            as: 'teoriaTeacher',
          },
        },
        {
          $lookup: {
            from: 'teachers',
            localField: 'pratica',
            foreignField: '_id',
            as: 'praticaTeacher',
          },
        },
        {
          $addFields: {
            amount_studentsId: {
              $size: {
                $ifNull: ['$alunos_matriculados', []],
              },
            },
          },
        },
        {
          $group: {
            _id: '$codigo',
            // This creates a unique set of all student IDs across all components in the group
            allStudentsInGroup: { $addToSet: '$alunos_matriculados' },
            components: {
              $push: {
                disciplina_id: '$disciplina_id',
                amount_studentsId: '$$ROOT.quantidade_alunos_matriculados',
                nome: '$disciplina',
                turma: '$turma',
                vagas: '$vagas',
                uf_cod_turma: '$uf_cod_turma',
                component_code: '$codigo',
                // Extract the teacher name immediately during the push
                teoria: { $arrayElemAt: ['$teoriaTeacher.name', 0] },
                pratica: { $arrayElemAt: ['$praticaTeacher.name', 0] },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            codigo: '$_id',
            // $reduce transforms the array of arrays into one flat unique array to count unique students
            amount_subject_students: {
              $size: {
                $reduce: {
                  input: '$allStudentsInGroup',
                  initialValue: [],
                  in: { $setUnion: ['$$value', '$$this'] },
                },
              },
            },
            components: 1,
          },
        },
        { $sort: { amount_subject_students: -1 } },
      ]);
      return reply.status(200).send({
        status: 'success',
        data: requested,
      });
    },
    method: 'GET',
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
    url: '/components/pending-group-url',
  });

  app.route({
    handler: async (request, reply) => {
      const { season } = request.query;
      const cacheKey = `list:components:${season}`;

      const cached =
        await request.redisService.getJSON<ListComponent[]>(cacheKey);
      if (cached) {
        return reply.status(200).send(cached);
      }

      const components = await ComponentModel.find({ season })
        .populate<{ teoria: PopulatedComponent['teoria'] }>('teoria', 'name')
        .populate<{ pratica: PopulatedComponent['pratica'] }>('pratica', 'name')
        .populate<{ subject: PopulatedComponent['subject'] }>('subject', 'name')
        .lean<PopulatedComponent[]>({ defaults: false });

      const mappedComponents = components.map(
        (component): ListComponent => ({
          subject: component.subject?.name ?? '',
          codigo: component.codigo ?? '',
          turma: component.turma,
          turno: component.turno,
          vagas: component.vagas,
          campus: component.campus,
          season: component.season,
          uf_cod_turma: component.uf_cod_turma,
          identifier: component.identifier ?? null,
          disciplina_id: component.disciplina_id ?? null,
          requisicoes: component.alunos_matriculados?.length ?? 0,
          teoria: component.teoria?.name ?? null,
          pratica: component.pratica?.name ?? null,
          teoriaId: component.teoria?._id?.toString() ?? null,
          praticaId: component.pratica?._id?.toString() ?? null,
          groupURL: component.groupURL ?? null,
          subjectId: component.subject?._id?.toString() ?? '',
        })
      );

      await request.redisService.setJSON(
        cacheKey,
        mappedComponents as ListComponent[],
        '1h'
      );

      return reply.status(200).send(mappedComponents);
    },
    method: 'GET',
    preHandler: [jwtVerifyHook],
    schema: {
      querystring: z.object({
        season: z.string().default(currentQuad()),
      }),
      response: {
        200: listComponentsSchema,
      },
    },
    url: '/components',
  });

  app.route({
    handler: async (request, reply) => {
      const { config } = request.server;
      const aiConnector = new AIProxyConnector(config.NEXT_AGENT_URL, 'whatsapp');

      const { season, componentId } = request.query;

      const component = await ComponentMetadataModel.findOne({
        'metadata.component_code': componentId,
        'metadata.component_data.season': season,
      });

      if (!component) {
        return reply.notFound('Component not found');
      }

      const { userMessage } = request.body as { userMessage: string };

      const response = await aiConnector.requestNaturalResponse(
        component,
        userMessage
      );

      return reply.status(200).send({
        status: 'success',
        data: response,
      });
    },
    method: 'POST',
    schema: {
      body: z.object({
        userMessage: z.string(),
      }),
      querystring: z.object({
        season: z.string().default('2026:2'),
        componentId: z.string(),
      }),
      response: {
        200: z.object({
          status: z.string(),
          data: z.any().optional(),
        }),
      },
    },
    url: '/components/metadata',
  });
};

export default componentsController;
