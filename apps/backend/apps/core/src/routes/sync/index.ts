import { createHash } from 'node:crypto';
import {
  getComponentsFile,
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
  // biome-ignore lint/suspicious/noExplicitAny: metadata can be any type
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
        components.set(component.uf_cod_turma, component);
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

          const component = components.get(studentClass.original);

          if (!component) {
            app.log.warn(
              {
                search: studentClass.original,
              },
              'could not find matching component via criteria',
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
      preHandler: (request, reply) => request.isAdmin(reply),
    },
    async (request, reply) => {
      const { season, hash, ignoreErrors, kind} = request.body;
      const componentsWithTeachers = await getComponentsFile(
        season,
        kind,
      );

      const teacherCache = new Map();
      const errors: Array<SyncError> = [];

      const findTeacher = async (name: string | null) => {
        if (!name) return null;
        const normalizedName = name
          .toLowerCase()
          .normalize('NFD')
          .replace(/\u0300-\u036f/g, '');
        if (teacherCache.has(normalizedName))
          return teacherCache.get(normalizedName);
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
        if (teacher && !teacher.alias.includes(normalizedName)) {
          await TeacherModel.findByIdAndUpdate(teacher._id, {
            $addToSet: { alias: [normalizedName, name.toLowerCase()] },
          });
        }
        teacherCache.set(normalizedName, teacher?._id ?? null);
        return teacher?._id ?? null;
      };

      const components = await Promise.all(
        componentsWithTeachers.map(async (c) => {
          const [teoria, pratica] = await Promise.all([
            findTeacher(c.teachers?.professor),
            findTeacher(c.teachers?.practice),
          ]);
          const dbComponent = await ComponentModel.findOne({
            season,
            $or: [
              { uf_cod_turma: c.UFClassroomCode.toUpperCase() },
              { uf_cod_turma: c.UFClassroomCode },
            ],
          }).lean();
          let subjectId = null;
          if (!dbComponent) {
            app.log.warn({
              msg: 'Component not found in database',
              uf_cod_turma: c.UFClassroomCode,
            });
            errors.push({
              original: c.UFClassroomCode,
              parserError: ['Component not found in database'],
              type: 'MATCHING_FAILED',
            });
            // Normalize the subject code (strip year, uppercase, etc.)
            const codeMatch = c.UFComponentCode.match(/^(.*?)-\d{2}$/);
            const normalizedCode = codeMatch ? codeMatch[1] : c.UFComponentCode;
            const subject = await SubjectModel.findOne({
              uf_subject_code: { $in: [normalizedCode] },
            }).lean();
            if (!subject) {
              app.log.warn({
                msg: 'Subject not found for unmatched component',
                component: c,
              });
              errors.push({
                original: c.name,
                parserError: ['Subject not found for unmatched component'],
                type: 'MATCHING_FAILED',
              });
            }
            subjectId = subject?._id;
            return {
              disciplina_id: null,
              campus: c.campus,
              disciplina: c.name,
              turno: c.turno,
              turma: c.turma,
              uf_cod_turma: c.UFClassroomCode,
              year: Number(season.split(':')[0]),
              quad: Number(season.split(':')[1]),
              codigo: c.UFComponentCode,
              season,
              teoria,
              pratica,
              subject: subjectId,
              after_kick: [],
              before_kick: [], // added to fix type error
              alunos_matriculados: [],
              obrigatorias: [],
              ideal_quad: false,
              vagas: c.vacancies,
              kind: 'file' as 'file' | 'api',
              flag: 'upsert',
              ignoreErrors,
            };
          }
          return {
            ...dbComponent,
            campus: c.campus,
            disciplina: c.name,
            turno: c.turno,
            turma: c.turma,
            uf_cod_turma: c.UFClassroomCode,
            teoria,
            pratica,
            ignoreErrors,
          };
        }),
      );

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

      // Dispatch all jobs, always passing flag and ignoreErrors
      const dispatchPromises = components.map(async (componentData) => {
        try {
          if (!componentData.subject) {
            request.log.warn({
              error: 'Component data is missing',
              component: componentData.disciplina,
              msg: 'Component data is missing',
            });
            throw new Error('Component data is missing');
          }

          // fuck this
          // @ts-expect-error
          await app.job.dispatch('ComponentsTeachersSync', componentData);
          return { success: true, component: componentData.disciplina };
        } catch (error) {
          const errorMsg = `Failed to dispatch component: ${componentData.disciplina}`;
          if (ignoreErrors) {
            request.log.warn({
              error: error instanceof Error ? error.message : String(error),
              component: componentData.disciplina,
              msg: `${errorMsg} (ignored)`,
            });
            return {
              success: false,
              component: componentData.disciplina,
              ignored: true,
            };
          }
          request.log.error({
            error: error instanceof Error ? error.message : String(error),
            component: componentData.disciplina,
            msg: errorMsg,
          });
          throw error;
        }
      });
      const dispatchResults = await Promise.all(dispatchPromises);
      const successfulDispatches = dispatchResults.filter(
        (r) => r.success,
      ).length;
      const ignoredErrors = dispatchResults.filter(
        (r) => !r.success && r.ignored,
      ).length;
      return reply.send({
        dispatched: true,
        msg: 'Component teacher sync jobs dispatched',
        totalComponents: components.length,
        successfulDispatches,
        ignoredErrors: ignoreErrors ? ignoredErrors : 0,
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
