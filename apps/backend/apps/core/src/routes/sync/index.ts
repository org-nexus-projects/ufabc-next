import { createHash } from 'node:crypto';
import {
  getComponentsFile,
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
import { SubjectModel } from '@/models/Subject.js';

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
      // preHandler: (request, reply) => request.isAdmin(reply),
    },
    async (request, reply) => {
      const { season, hash, ignoreErrors } = request.body;
      const componentsWithTeachers = await getComponentsFile(
        season,
        'settlement',
      );

      const teacherCache = new Map();
      const errors: Array<SyncError> = [];

      const findTeacher = async (name: string | null) => {
        if (!name) {
          return null;
        }

        const normalizedName = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        if (teacherCache.has(normalizedName)) {
          return teacherCache.get(normalizedName);
        }

        const teacher = await TeacherModel.findByFuzzName(normalizedName);
        if (!teacher && normalizedName !== '0') {
          app.log.warn({
            msg: 'Teacher not found',
            originalName: name,
            normalizedName,
          });
          errors.push({
            original: name,
            parserError: ['Teacher not found in database'],
            metadata: { normalizedName },
            type: 'TEACHER_NOT_FOUND',
          });
          teacherCache.set(normalizedName, null);
          return null;
        }

        if (!teacher.alias.includes(normalizedName)) {
          await TeacherModel.findByIdAndUpdate(teacher._id, {
            $addToSet: {
              alias: [normalizedName, name.toLowerCase()],
            },
          });
        }

        teacherCache.set(normalizedName, teacher._id);
        return teacher._id;
      };

      const componentsIterator = ComponentModel.find({
        season,
      })
        .lean()
        .cursor();

      const dbComponents = new Map<string, Component>();
      for await (const component of componentsIterator) {
        dbComponents.set(component.uf_cod_turma, component);
      }

      const componentsWithTeachersPromises = componentsWithTeachers.map(
        async (c) => {
          const [teoria, pratica] = await Promise.all([
            findTeacher(c.teachers?.professor),
            findTeacher(c.teachers?.practice),
          ]);

          const dbComponent = dbComponents.get(c.UFClassroomCode);
          if (!dbComponent) {
            errors.push({
              original: c.name,
              parserError: ['Component not found in database'],
              metadata: {
                componentKey: c.UFClassroomCode,
                componentId: c.UFComponentId,
                debug: c,
              },
              type: 'MATCHING_FAILED',
            });
            return null;
          }

          return {
            disciplina_id: c.UFComponentId,
            UFClassroomCode: c.UFClassroomCode,
            codigo: c.UFComponentCode,
            disciplina: c.name,
            campus: c.campus,
            turma: c.turma,
            turno: c.turno,
            vagas: c.vacancies,
            teoria,
            pratica,
            season,
          };
        },
      );

      const components = (
        await Promise.all(componentsWithTeachersPromises)
      ).filter(Boolean);

      if (!ignoreErrors && errors.length > 0) {
        const teacherErrors = errors.filter(
          (e) => e.type === 'TEACHER_NOT_FOUND',
        );
        const matchingErrors = errors.filter(
          (e) => e.type === 'MATCHING_FAILED',
        );

        return reply.status(403).send({
          msg: 'Errors found while verifying components',
          errors: {
            missingTeachers: [...new Set(teacherErrors.map((e) => e.original))],
            unmatchedComponents: matchingErrors,
          },
          totalErrors: errors.length,
          breakdown: {
            teacherErrors: teacherErrors.length,
            matchingErrors: matchingErrors.length,
          },
        });
      }

      const componentHash = createHash('md5')
        .update(JSON.stringify(components))
        .digest('hex');

      if (componentHash !== hash) {
        return {
          hash: componentHash,
          errors,
          total: components.length,
          payload: components,
        };
      }

      return reply.send({
        verified: true,
        msg: 'All components verified successfully',
        totalComponents: components.length,
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
