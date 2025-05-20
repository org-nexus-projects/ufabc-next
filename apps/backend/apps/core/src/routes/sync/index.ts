import { createHash } from 'node:crypto';
import { ofetch } from 'ofetch';
import { generateIdentifier } from '@next/common';
import {
  getComponentsV2,
  getEnrolledStudents,
  getEnrollments,
  type StudentComponent,
} from '@/modules/ufabc-parser.js';
import { syncEnrollmentsSchema } from '@/schemas/sync/enrollments.js';
import { syncComponentsSchema } from '@/schemas/sync/components.js';
import { TeacherModel } from '@/models/Teacher.js';
import { ComponentModel, type Component } from '@/models/Component.js';
import { syncEnrolledSchema } from '@/schemas/sync/enrolled.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    '/enrollments',
    {
      schema: syncEnrollmentsSchema,
      preHandler: (request, reply) => request.isAdmin(reply),
    },
    async (request, reply) => {
      const { hash, season, link } = request.body;
      const [tenantYear, tenantQuad] = season.split(':');

      const doesLinkExist = await ofetch(link, {
        method: 'OPTIONS',
      });

      if (!doesLinkExist) {
        return reply.badRequest('O link enviado deve existir');
      }

      const components = await ComponentModel.find({
        season,
      }).lean();

      const rawEnrollments = await getEnrollments(link);
      const kvEnrollments = Object.entries(rawEnrollments);
      const tenantEnrollments = kvEnrollments.map(([ra, studentComponents]) => {
        const hydratedStudentComponents = hydrateComponent(
          ra,
          studentComponents,
          components,
          Number(tenantYear),
          Number(tenantQuad) as 1 | 2 | 3,
        );

        return {
          ra,
          year: Number(tenantYear),
          quad: Number(tenantQuad),
          season,
          components: hydratedStudentComponents,
        };
      });
      const enrollments = tenantEnrollments.flatMap(
        (enrollment) => enrollment.components,
      );

      const enrollmentsHash = createHash('md5')
        .update(JSON.stringify(enrollments))
        .digest('hex');

      if (enrollmentsHash !== hash) {
        return {
          hash: enrollmentsHash,
          size: enrollments.length,
          sample: enrollments.slice(0, 500),
        };
      }

      const enrollmentJobs = enrollments.map(async (enrollment) => {
        try {
          // @ts-ignore for now
          await app.job.dispatch('EnrollmentSync', enrollment);
        } catch (error) {
          request.log.error({
            error: error instanceof Error ? error.message : String(error),
            enrollment,
            msg: 'Failed to dispatch enrollment processing job',
          });
        }
      });

      await Promise.all(enrollmentJobs);

      return reply.send({
        published: true,
        msg: 'Enrollments Synced',
        totalEnrollments: enrollments.length,
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

export function hydrateComponent(
  ra: string,
  studentComponents: StudentComponent[],
  components: Component[],
  year: number,
  quad: 1 | 2 | 3,
) {
  const result = [];
  const errors = [];
  const componentsMap = new Map<string, Component>();

  for (const component of components) {
    componentsMap.set(component.disciplina.toLocaleLowerCase(), component);
  }

  for (const studentComponent of studentComponents) {
    if (!studentComponent.name) {
      continue;
    }

    const component = componentsMap.get(studentComponent.name);
    if (!component) {
      errors.push(component);
      continue;
    }

    const identifier = generateIdentifier({
      // @ts-expect-error
      ra,
      year,
      quad,
      disciplina: component.disciplina,
    });

    const disciplina_identifier = generateIdentifier({
      year,
      quad,
      disciplina: component.disciplina,
    });

    result.push({
      ra: Number(ra),
      nome: `${component.disciplina} ${component.turma}-${component.turno} (${component.campus})`,
      campus: component.campus,
      turno: component.turno,
      turma: component.turma,
      disciplina: component.disciplina.toLocaleLowerCase(),
      year,
      quad,
      identifier,
      disciplina_identifier,
      teoria: component.teoria,
      pratica: component.pratica,
      subject: component.subject,
      season: component.season,
    });
  }

  return result;
}

export default plugin;
