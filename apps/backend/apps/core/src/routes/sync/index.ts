import { ComponentModel } from '@/models/Component.js';
import { hydrateComponent } from '@/modules/sync/utils/hydrateComponents.js';
import { createHash } from 'node:crypto';
import { ofetch } from 'ofetch';
import { getComponentsFile, getEnrollments } from '@/modules-v2/ufabc-parser.js';
import { syncEnrollmentsSchema } from '@/schemas/sync/enrollments.js';
import { syncComponentsSchema } from '@/schemas/sync/components.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { TeacherModel } from '@/models/Teacher.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    '/enrollments',
    { schema: syncEnrollmentsSchema, onRequest: (request, reply) => request.isAdmin(reply) },
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
  
  app.put('/components', { schema: syncComponentsSchema }, async (request, reply) => {
    const { season, hash, link, ignoreErrors } = request.body
    const componentsWithTeachers = await getComponentsFile(link)

    const teacherCache = new Map();
    const errors: string[] = []

    const findTeacher = async (name: string | null) => {
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

    const componentsWithTeachersPromises = componentsWithTeachers.map(async (component) => {
      if (!component.name) {
        errors.push(
          `Missing required field for component: ${component.UFComponentCode || 'Unknown'}`,
        );
      }

      const [teoria, pratica] = await Promise.all([
        findTeacher(component.teachers?.professor),
        findTeacher(component.teachers?.practice),
      ]);

      return {
        disciplina_id: component.UFComponentId,
        codigo: component.UFComponentCode,
        disciplina: component.name,
        campus: component.campus,
        turma: component.turma,
        turno: component.turno,
        vagas: component.vacancies,
        teoria,
        pratica,
        season,
      }
    })

    const components = await Promise.all(componentsWithTeachersPromises)

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

  })
};

export default plugin;
