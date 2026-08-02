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
      const session = request.requestContext.get('moodleSession')! as {
        sessionId: string;
        sessKey: string;
      };
      const hasLock = await request.acquireLock(session.sessionId, '24h');
      const isDevelopment = app.config.NODE_ENV !== 'prod';

      if (!hasLock && !isDevelopment) {
        request.log.debug(
          { sessionId: session.sessionId },
          'Archives already processing'
        );
        return reply.status(202).send({ status: 'success' });
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

      if (!user?.ra) {
        request.log.warn(
          { email },
          'User does not have RA, skipping enrollment check'
        );
        throw new UserWithoutRA();
      }

      const componentsService = new ComponentsService({
        manager: app.manager,
        globalTraceId: request.id,
      });
      await componentsService.processComponentArchives(session);

      return reply.status(202).send({
        status: 'success',
      });
    },
    method: 'POST',
    preHandler: [moodleSession],
    onError: async (request) => {
      const session = request.requestContext.get('moodleSession') as
        | { sessionId: string }
        | undefined;
      if (session) {
        await request.releaseLock(session.sessionId);
      }
    },
    schema: {
      headers: z.object({
        'session-id': z.string(),
        'sess-key': z.string(),
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
      const session = request.requestContext.get('moodleSession')! as {
        sessionId: string;
        sessKey: string;
      };
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
    preHandler: [moodleSession],
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
        return reply.notFound('Component not found');
      }

      return reply.status(200).send(response);
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
        s3_key: archive.s3_key ?? null,
        original_url: archive.original_url,
        file_name: archive.file_name ?? null,
        status: archive.status,
        source: archive.source,
        timeline: (archive.timeline ?? []).map((event) => ({
          status: event.status,
          timestamp: event.timestamp?.toISOString() ?? '',
          metadata: event.metadata,
        })),
        createdAt: archive.createdAt?.toISOString() ?? '',
        component: archive.component ?? null,
      }));

      return await reply.status(200).send({ status: 'success', data });
    },
    method: 'GET',
    schema: {
      params: z.object({
        componentId: z.string(),
      }),
      response: {
        200: z.object({
          status: z.string(),
          data: z.array(z.any()),
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
          status: 'error',
          message: 'Archive not found or not yet stored',
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
          status: 'error',
          message: 'Empty file on S3',
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
        componentId: z.string(),
        archiveId: z.string(),
      }),
      response: {
        200: z.any(),
        404: z.object({ status: z.string(), message: z.string() }),
        500: z.object({ status: z.string(), message: z.string() }),
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
      let response: any = null;

      if (externalKey) {
        component = await ComponentMetadataModel.findOne({
          'metadata.component_data.componentKey': externalKey,
          'metadata.component_data.season': season,
        }).lean<ComponentMetadata>();

        if (!component) {
          component = await ComponentMetadataModel.findOne({
            'metadata.component_data.componentKey': externalKey,
          }).lean<ComponentMetadata>();
        }

        if (!component) {
          return reply.notFound('Component not found');
        }

        response = await aiConnector.requestNaturalResponse(
          component,
          userMessage
        );
      }

      return reply.status(200).send({
        status: 'success',
        data: response,
      });
    },
    method: 'POST',
    preHandler: [validateInternalTokenAuthHook],
    schema: {
      body: z.object({
        userMessage: z.string(),
      }),
      querystring: z.object({
        season: z.string().default('2026:2'),
        externalKey: z.string().optional(),
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
