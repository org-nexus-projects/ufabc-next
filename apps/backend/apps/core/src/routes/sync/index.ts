import { createHash } from 'node:crypto';
import {
  getComponentsV2,
  getEnrolledStudents,
  getEnrollments,
} from '@/modules/ufabc-parser.js';
import { syncEnrollmentsSchema } from '@/schemas/sync/enrollments.js';
import { syncComponentsSchema } from '@/schemas/sync/components.js';
import { TeacherModel } from '@/models/Teacher.js';
import { ComponentModel, type Component } from '@/models/Component.js';
import { syncEnrolledSchema } from '@/schemas/sync/enrolled.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

export type StudentEnrollment = Component & {
  ra: number;
  nome: string;
};

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    '/enrollments',
    {
      schema: syncEnrollmentsSchema,
      // preHandler: (request, reply) => request.isAdmin(reply),
    },
    async (request, reply) => {
      const { hash, season, kind } = request.body;
      const [tenantYear, tenantQuad] = season.split(':');
      const MANDATORY_FIELDS = ['shift', 'campus', 'class', 'code'];
      const errors: Array<{
        original: string;
        parserError: string[];
        metadata?: any;
        type: 'MATCHING_FAILED' | 'MISSING_MANDATORY_FIELDS';
      }> = [];
      const componentsIterator = ComponentModel.find({
        season,
      })
        .lean()
        .cursor();

      const components = new Map<string, Component>();
      for await (const component of componentsIterator) {
        const key = `${component.codigo}:${component.campus}:${component.turno}:${component.turma}`;
        components.set(key, component);
      }

      const rawEnrollments = await getEnrollments(kind, season);
      const kvEnrollments = Object.entries(rawEnrollments);

      const tenantEnrollments = [];

      for (const [ra, classes] of kvEnrollments) {
        const studentEnrollments: Array<StudentEnrollment> = [];

        for (const studentClass of classes) {
          const isMissingAllMandatory = Object.keys(studentClass).every(
            (f) => !MANDATORY_FIELDS.includes(f),
          );
          const isErrorParsingName = studentClass.errors?.includes(
            'Could not parse name:',
          );

          if (
            isMissingAllMandatory &&
            isErrorParsingName &&
            !studentClass.name
          ) {
            app.log.warn(
              { studentClass },
              'Component missing mandatory fields or has parse errors',
            );
            errors.push({
              original: studentClass.original,
              parserError: studentClass.errors,
              type: 'MISSING_MANDATORY_FIELDS',
            });
            continue;
          }

          const componentKey = `${studentClass.code}:${studentClass.campus}:${
            studentClass.shift === 'night' ? 'noturno' : 'diurno'
          }:${studentClass.class}`;
          const component = components.get(componentKey);

          if (!component) {
            app.log.warn(
              {
                componentKey,
              },
              'could not find matching component via criteria',
            );
            // collect and move on
            errors.push({
              original: studentClass.original,
              parserError: studentClass.errors,
              metadata: {
                componentKey,
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
        (enrollment) => enrollment.enrollments,
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
        (e) => e.type !== 'MATCHING_FAILED',
      );

      if (isAllComponentsMatched) {
        const enrollmentJobs = enrollments.map(
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
          },
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
    },
  );

  app.put(
    '/components',
    {
      schema: syncComponentsSchema,
      preHandler: (request, reply) => request.isAdmin(reply),
    },
    async (request, reply) => {
      const { season, hash, ignoreErrors } = request.body;
      const componentsWithTeachers = await getComponentsV2(season);

      const teacherCache = new Map();
      const errors: string[] = [];

      const findTeacher = async (name: string | undefined) => {
        if (!name) {
          return null;
        }
        const caseSafeName = name.toLowerCase();

        if (teacherCache.has(caseSafeName)) {
          return teacherCache.get(caseSafeName);
        }

        const teacher = await TeacherModel.findByFuzzName(caseSafeName);

        if (!teacher) {
          errors.push(caseSafeName);
          teacherCache.set(caseSafeName, null);
          return null;
        }

        if (!teacher.alias.includes(caseSafeName)) {
          await TeacherModel.findByIdAndUpdate(teacher._id, {
            $addToSet: { alias: caseSafeName },
          });
        }

        teacherCache.set(caseSafeName, teacher._id);
        return teacher._id;
      };

      const componentsWithTeachersPromises = componentsWithTeachers.map(
        async (component) => {
          if (!component.name) {
            errors.push(
              `Missing required field for component: ${component.UFComponentCode || 'Unknown'}`,
            );
          }

          const [teoria, pratica] = await Promise.all([
            findTeacher(component.teachers?.professor),
            findTeacher(component.teachers?.practice),
          ]);
          const turno: 'diurno' | 'noturno' =
            component.shift === 'morning' ? 'diurno' : 'noturno';

          return {
            disciplina_id: component.UFComponentId,
            codigo: component.UFComponentCode,
            disciplina: component.name,
            campus: component.campus,
            turma: component.class,
            turno,
            vagas: component.vacancies,
            teoria,
            pratica,
            season,
          };
        },
      );

      const components = await Promise.all(componentsWithTeachersPromises);

      if (!ignoreErrors && errors.length > 0) {
        const errorsSet = [...new Set(errors)];
        return reply.status(403).send({
          msg: 'Missing professors while parsing',
          names: errorsSet,
          size: errorsSet.length,
        });
      }

      const componentHash = createHash('md5')
        .update(JSON.stringify(components))
        .digest('hex');

      if (componentHash !== hash) {
        return {
          hash: componentHash,
          errors: [...new Set(errors)],
          total: components.length,
          payload: components,
        };
      }

      const componentsJobs = components.map(async (component) => {
        try {
          await app.job.dispatch('ComponentsTeachersSync', component);
        } catch (error) {
          request.log.error({
            error: error instanceof Error ? error.message : String(error),
            component,
            msg: 'Failed to dispatch component processing job',
          });
        }
      });

      await Promise.all(componentsJobs);

      return reply.send({
        published: true,
        msg: 'Dispatched Components Job',
        totalEnrollments: components.length,
      });
    },
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

      const enrolledStudents = await getEnrolledStudents();

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
              { upsert: true, new: true },
            );
          } catch (error) {
            request.log.error({
              error: error instanceof Error ? error.message : String(error),
              students,
              msg: 'Failed to process Enrolled processing job',
            });
          }
        },
      );

      const processed = await Promise.all(enrolledOperationsPromises);

      return {
        status: 'ok',
        time: Date.now() - start,
        componentsProcessed: processed.length,
      };
    },
  );
};

export default plugin;
