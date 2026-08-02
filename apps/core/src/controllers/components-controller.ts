import { currentQuad } from '@next/utils';
import { load } from 'cheerio';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { AIProxyConnector } from '@/connectors/ai-proxy.js';
import { MoodleConnector } from '@/connectors/moodle.js';
import {
  EmailVerificationFailed,
  UserWithoutRA,
} from '@/errors/custom-errors.js';
import { jwtVerifyHook } from '@/hooks/jwt-verify.js';
import type { Session } from '@/hooks/moodle-session.js';
import { moodleSession } from '@/hooks/moodle-session.js';
import { validateInternalTokenAuthHook } from '@/hooks/validate-token.js';
import { ComponentModel } from '@/models/Component.js';
import { ComponentArchiveModel } from '@/models/ComponentArchive.js';
import { ComponentMetadataModel } from '@/models/ComponentMetadata.js';
import type { ComponentMetadata } from '@/models/ComponentMetadata.js';
import { UserModel } from '@/models/User.js';
import type {
  ListComponent,
  PopulatedComponent,
} from '@/schemas/v2/components.js';
import {
  getComponentSchema,
  listComponentsSchema,
} from '@/schemas/v2/components.js';
import { ComponentsService } from '@/services/components-service.js';

const moodleConnector = new MoodleConnector();

const componentsController: FastifyPluginAsyncZod = async (app) => {
  app.route({
    handler: async (request, reply) => {
      const session = request.requestContext.get<Session>('moodleSession');
      if (!session) {
        return await reply.unauthorized();
      }

      const hasLock = await request.acquireLock(session.sessionId, '24h');
      const isDevelopment = app.config.NODE_ENV !== 'prod';

      if (!hasLock && !isDevelopment) {
        request.log.debug(
          { sessionId: session.sessionId },
          'Archives already processing'
        );
        return await reply.status(202).send({ status: 'success' });
      }

      const requestConnector = new MoodleConnector(request.id);
      const userPage = await requestConnector.getUserPage(session.sessionId);
      const $ = load(userPage);
      const email = $(
        '#region-main > div > div > div.userprofile > div > section:nth-child(1) > div > ul > li:nth-child(2) > dl > dd > a'
      ).text();

      if (!email) {
        throw new EmailVerificationFailed();
      }

      const user = await UserModel.findOne({ email });

      if (user?.ra === undefined || user.ra === null || user.ra === 0) {
        request.log.warn(
          { email },
          'User does not have RA, skipping enrollment check'
        );
        throw new UserWithoutRA();
      }

      const componentsService = new ComponentsService({
        globalTraceId: request.id,
        manager: app.manager,
      });
      await componentsService.processComponentArchives(session);

      return await reply.status(202).send({
        status: 'success',
      });
    },
    method: 'POST',
    onError: async (request) => {
      const session = request.requestContext.get<Session>('moodleSession');
      if (session !== undefined) {
        await request.releaseLock(session.sessionId);
      }
    },
    preHandler: [moodleSession],
    schema: {
      headers: z.object({
        'sess-key': z.string(),
        'session-id': z.string(),
      }),
      response: {
        200: z.any(),
        202: z.object({
          status: z.string(),
        }),
      },
    },
    url: '/components/archives',
  });

  app.route({
    handler: async (request, reply) => {
      const session = request.requestContext.get<Session>('moodleSession');
      if (!session) {
        return await reply.unauthorized();
      }

      const components = await moodleConnector.getComponents(
        session.sessionId,
        session.sessKey
      );
      return await reply.status(200).send({
        data: components,
        status: 'success',
      });
    },
    method: 'GET',
    preHandler: [moodleSession],
    schema: {
      response: {
        200: z.object({
          data: z.any().array(),
          status: z.string(),
        }),
      },
    },
    url: '/components/archives',
  });

  app.route({
    handler: async (_request, reply) => {
      const uploads = await app.aws.s3.list(app.config.AWS_BUCKET);
      return await reply.status(200).send({
        data: uploads,
        status: 'success',
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
            $or: [{ groupURL: null }, { groupURL: { $exists: false } }],
            season,
          },
        },
        {
          $lookup: {
            as: 'teoriaTeacher',
            foreignField: '_id',
            from: 'teachers',
            localField: 'teoria',
          },
        },
        {
          $lookup: {
            as: 'praticaTeacher',
            foreignField: '_id',
            from: 'teachers',
            localField: 'pratica',
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
                amount_studentsId: '$$ROOT.quantidade_alunos_matriculados',
                component_code: '$codigo',
                disciplina_id: '$disciplina_id',
                nome: '$disciplina',
                // Extract the teacher name immediately during the push
                pratica: { $arrayElemAt: ['$praticaTeacher.name', 0] },
                teoria: { $arrayElemAt: ['$teoriaTeacher.name', 0] },
                turma: '$turma',
                uf_cod_turma: '$uf_cod_turma',
                vagas: '$vagas',
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            // $reduce transforms the array of arrays into one flat unique array to count unique students
            amount_subject_students: {
              $size: {
                $reduce: {
                  in: { $setUnion: ['$$value', '$$this'] },
                  initialValue: [],
                  input: '$allStudentsInGroup',
                },
              },
            },
            codigo: '$_id',
            components: 1,
          },
        },
        { $sort: { amount_subject_students: -1 } },
      ]);
      return await reply.status(200).send({
        data: requested,
        status: 'success',
      });
    },
    method: 'GET',
    schema: {
      querystring: z.object({
        season: z.string(),
      }),
      response: {
        200: z.object({
          data: z.any().array(),
          status: z.string(),
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
        return await reply.status(200).send(cached);
      }

      const components = await ComponentModel.find({ season })
        .populate<{ teoria: PopulatedComponent['teoria'] }>('teoria', 'name')
        .populate<{ pratica: PopulatedComponent['pratica'] }>('pratica', 'name')
        .populate<{ subject: PopulatedComponent['subject'] }>('subject', 'name')
        .lean<PopulatedComponent[]>({ defaults: false });

      const mappedComponents = components.map(
        (component): ListComponent => ({
          campus: component.campus,
          codigo: component.codigo ?? '',
          disciplina_id: component.disciplina_id ?? null,
          groupURL: component.groupURL ?? null,
          identifier: component.identifier ?? null,
          pratica: component.pratica?.name ?? null,
          praticaId: component.pratica?._id?.toString() ?? null,
          requisicoes: component.alunos_matriculados?.length ?? 0,
          season: component.season,
          subject: component.subject?.name ?? '',
          subjectId: component.subject?._id?.toString() ?? '',
          teoria: component.teoria?.name ?? null,
          teoriaId: component.teoria?._id?.toString() ?? null,
          turma: component.turma,
          turno: component.turno,
          uf_cod_turma: component.uf_cod_turma,
          vagas: component.vagas,
        })
      );

      await request.redisService.setJSON(cacheKey, mappedComponents, '1h');

      return await reply.status(200).send(mappedComponents);
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
      const { id } = request.params;
      const { with_metadata } = request.query;

      const componentsService = new ComponentsService({
        requestId: request.id,
      });
      const response = await componentsService.findComponentByIdOrOriginKey(
        id,
        with_metadata
      );

      if (!response) {
        return await reply.notFound('Component not found');
      }

      return await reply.status(200).send(response);
    },
    method: 'GET',
    schema: {
      params: z.object({
        id: z.string(),
      }),
      querystring: z.object({
        with_metadata: z.coerce.boolean().default(false),
      }),
      response: {
        200: getComponentSchema,
      },
    },
    url: '/components/:id',
  });

  app.route({
    handler: async (request, reply) => {
      const { componentId } = request.params as { componentId: string };

      const archives = await ComponentArchiveModel.find({
        component: componentId,
      })
        .populate('component', 'disciplina codigo turma turno season')
        .sort({ createdAt: -1 })
        .lean();

      const data = archives.map((archive) => ({
        _id: archive._id.toString(),
        component: archive.component ?? null,
        createdAt: archive.createdAt?.toISOString() ?? '',
        file_name: archive.file_name ?? null,
        original_url: archive.original_url,
        s3_key: archive.s3_key ?? null,
        source: archive.source,
        status: archive.status,
        timeline: (archive.timeline ?? []).map((event) => ({
          metadata: event.metadata as unknown,
          status: event.status,
          timestamp: event.timestamp?.toISOString() ?? '',
        })),
      }));

      return await reply.status(200).send({ data, status: 'success' });
    },
    method: 'GET',
    schema: {
      params: z.object({
        componentId: z.string(),
      }),
      response: {
        200: z.object({
          data: z.array(z.any()),
          status: z.string(),
        }),
      },
    },
    url: '/components/:componentId/archives',
  });

  app.route({
    handler: async (request, reply) => {
      const { archiveId } = request.params as { archiveId: string };

      const archive = await ComponentArchiveModel.findById(archiveId);
      if (!archive || typeof archive.s3_key !== 'string') {
        return await reply.code(404).send({
          message: 'Archive not found or not yet stored',
          status: 'error',
        });
      }

      const s3Object = await app.aws.s3.getObject(
        app.config.AWS_BUCKET,
        archive.s3_key
      );

      const filename = archive.file_name ?? 'document.pdf';
      const contentType = s3Object.ContentType ?? 'application/octet-stream';

      if (!s3Object.Body) {
        return await reply.code(500).send({
          message: 'Empty file on S3',
          status: 'error',
        });
      }

      return await reply
        .type(contentType)
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .send(s3Object.Body);
    },
    method: 'GET',
    schema: {
      params: z.object({
        archiveId: z.string(),
        componentId: z.string(),
      }),
      response: {
        200: z.any(),
        404: z.object({ message: z.string(), status: z.string() }),
        500: z.object({ message: z.string(), status: z.string() }),
      },
    },
    url: '/components/:componentId/archives/:archiveId/download',
  });

  app.route({
    handler: async (request, reply) => {
      const { config } = request.server;
      const aiConnector = new AIProxyConnector(
        config.NEXT_AGENT_URL,
        'whatsapp'
      );

      const { externalKey, season } = request.query;
      const { userMessage } = request.body as { userMessage: string };

      let component: ComponentMetadata | null = null;
      let response: unknown = null;

      if (externalKey !== undefined) {
        component = await ComponentMetadataModel.findOne({
          'metadata.component_data.componentKey': externalKey,
          'metadata.component_data.season': season,
        }).lean<ComponentMetadata>();

        component ??= await ComponentMetadataModel.findOne({
          'metadata.component_data.componentKey': externalKey,
        }).lean<ComponentMetadata>();

        if (component === null) {
          return await reply.notFound('Component not found');
        }

        response = await aiConnector.requestNaturalResponse(
          component,
          userMessage
        );
      }

      return await reply.status(200).send({
        data: response,
        status: 'success',
      });
    },
    method: 'POST',
    preHandler: [validateInternalTokenAuthHook],
    schema: {
      body: z.object({
        userMessage: z.string(),
      }),
      querystring: z.object({
        externalKey: z.string().optional(),
        season: z.string().default('2026:2'),
      }),
      response: {
        200: z.object({
          data: z.any().optional(),
          status: z.string(),
        }),
      },
    },
    url: '/components/metadata',
  });
};

export default componentsController;
