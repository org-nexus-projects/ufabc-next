import { ComponentModel } from '@/models/Component.js';
import { hydrateComponent } from '@/modules/sync/utils/hydrateComponents.js';
import { createHash } from 'node:crypto';
import { ofetch } from 'ofetch';
import { getEnrollments } from '@/modules-v2/ufabc-parser.js';
import { syncEnrollmentsSchema } from '@/schemas/sync/enrollments.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    '/enrollments',
    { schema: syncEnrollmentsSchema },
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
};

export default plugin;
