import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import { createHash } from 'node:crypto';

import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { ComponentModel, type Component } from '@/models/Component.js';
import { syncComponentsSchema } from '@/schemas/sync/components.js';
import { syncEnrolledSchema } from '@/schemas/sync/enrolled.js';
import { syncEnrollmentsSchema } from '@/schemas/sync/enrollments.js';

export type StudentEnrollment = Component & {
  ra: number;
  nome: string;
};

type SyncError = {
  original: string;
  parserError: string[];
  metadata?: any;
  type: 'MATCHING_FAILED' | 'MISSING_MANDATORY_FIELDS' | 'TEACHER_NOT_FOUND';
};

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  const connector = new UfabcParserConnector();
  app.post(
    '/enrollments',
    {
      schema: syncEnrollmentsSchema,
      preHandler: (request, reply) => request.isAdmin(reply),
    },
    async (request, reply) => {
      const { hash, season, kind } = request.body;
      const [tenantYear, tenantQuad] = season.split(':');
      const MANDATORY_FIELDS = ['shift', 'campus', 'class', 'code'];
      const errors: Array<SyncError> = [];
      const componentsIterator = ComponentModel.find({
        season,
      })
        .lean()
        .cursor();

      const components = new Map<string, Component>();
      for await (const component of componentsIterator) {
        components.set(component.uf_cod_turma, component);
      }

      const rawEnrollments = await connector.getEnrollments(kind, season);
      const kvEnrollments = Object.entries(rawEnrollments);

      const tenantEnrollments = [];

      for (const [ra, classes] of kvEnrollments) {
        const studentEnrollments: Array<StudentEnrollment> = [];

        for (const studentClass of classes) {
          const isMissingAllMandatory = Object.keys(studentClass).every(
            (f) => !MANDATORY_FIELDS.includes(f)
          );
          const isErrorParsingName = studentClass.errors?.includes(
            'Could not parse name:'
          );

          if (
            isMissingAllMandatory &&
            isErrorParsingName &&
            !studentClass.name
          ) {
            app.log.warn(
              { studentClass },
              'Component missing mandatory fields or has parse errors'
            );
            errors.push({
              original: studentClass.original,
              parserError: studentClass.errors,
              type: 'MISSING_MANDATORY_FIELDS',
            });
            continue;
          }

          const component = components.get(studentClass.original);

          if (!component) {
            app.log.warn(
              {
                search: studentClass.original,
              },
              'could not find matching component via criteria'
            );
            // collect and move on
            errors.push({
              original: studentClass.original,
              parserError: studentClass.errors,
              metadata: {
                componentKey: studentClass.original,
                data: studentClass.name,
              },
              type: 'MATCHING_FAILED',
            });
            continue;
          }

          studentEnrollments.push({
            ra: Number(ra),
            nome: `${component.disciplina} ${component.turma}-${component.turno} (${component.campus})`,
            ...component,
          });
        }
        const preInsertEnrollments = {
          ra,
          year: Number(tenantYear),
          quad: Number(tenantQuad),
          season,
          enrollments: studentEnrollments,
        };

        tenantEnrollments.push(preInsertEnrollments);
      }

      const enrollments = tenantEnrollments.flatMap(
        (enrollment) => enrollment.enrollments
      );

      const enrollmentsHash = createHash('md5')
        .update(JSON.stringify(enrollments))
        .digest('hex');

      if (enrollmentsHash !== hash) {
        return {
          hash: enrollmentsHash,
          errors,
          size: enrollments.length,
          sample: enrollments.slice(0, 500),
        };
      }

      const isAllComponentsMatched = errors.every(
        (e) => e.type !== 'MATCHING_FAILED'
      );

      if (isAllComponentsMatched) {
        const enrollmentJobs = enrollments.map(
          // @ts-ignore mongoose does not set id
          async ({ _id, ...enrollment }) => {
            try {
              await app.job.dispatch('EnrollmentSync', enrollment);
            } catch (error) {
              request.log.error({
                error: error instanceof Error ? error.message : String(error),
                enrollment,
                msg: 'Failed to dispatch enrollment processing job',
              });
            }
          }
        );
        await Promise.all(enrollmentJobs);
        return reply.send({
          published: true,
          msg: 'Enrollments Synced',
          totalEnrollments: enrollments.length,
        });
      }

      return reply.send({
        message: 'Some unmatched components were found',
        errors,
        size: enrollments.length,
      });
    }
  );


  app.put(
    '/enrolled',
    {
      schema: syncEnrolledSchema,
      preHandler: (request, reply) => request.isAdmin(reply),
    },
    async (request) => {
      const { operation } = request.body;
      const { season } = request.query;

      // @ts-expect-error delete later
      const enrolledStudents = await connector.getEnrolledStudents();

      const start = Date.now();

      const enrolledOperationsPromises = Object.entries(enrolledStudents).map(
        async ([componentId, students]) => {
          try {
            await ComponentModel.findOneAndUpdate(
              {
                disciplina_id: Number(componentId),
                season,
              },
              {
                $set: {
                  [operation]: students,
                },
              },
              { upsert: true, new: true }
            );
          } catch (error) {
            request.log.error({
              error: error instanceof Error ? error.message : String(error),
              students,
              msg: 'Failed to process Enrolled processing job',
            });
          }
        }
      );

      const processed = await Promise.all(enrolledOperationsPromises);

      return {
        status: 'ok',
        time: Date.now() - start,
        componentsProcessed: processed.length,
      };
    }
  );
};

export default plugin;
