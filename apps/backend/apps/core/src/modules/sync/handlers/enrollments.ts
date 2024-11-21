import { ofetch } from 'ofetch';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { ComponentModel } from '@/models/Component.js';
import { ufProcessor } from '@/services/ufprocessor.js';
import { hydrateComponent } from '../utils/hydrateComponents.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

const validateEnrollmentsBody = z.object({
  season: z.string(),
  link: z.string().url(),
  hash: z.string().optional(),
});

export async function syncEnrollments(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { hash, season, link } = validateEnrollmentsBody.parse(request.body);
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

  const rawEnrollments = await ufProcessor.getEnrollments(link);
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
      await request.server.job.dispatch('ProcessSingleEnrollment', enrollment);
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
}
