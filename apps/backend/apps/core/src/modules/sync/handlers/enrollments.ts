import { ofetch } from 'ofetch';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { ComponentModel } from '@/models/Component.js';
import { nextJobs } from '@/queue/NextJobs.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ufProcessor } from '@/services/ufprocessor.js';
import { hydrateComponent } from '../utils/hydrateComponents.js';
import { chunk } from 'lodash-es';

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

  const enrollments = await ufProcessor.getEnrollments(link);
  const kvEnrollments = Object.entries(enrollments);
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
  const nextEnrollments = tenantEnrollments.flatMap(
    (enrollment) => enrollment.components,
  );

  const enrollmentsHash = createHash('md5')
    .update(JSON.stringify(nextEnrollments))
    .digest('hex');

  if (enrollmentsHash !== hash) {
    return {
      hash: enrollmentsHash,
      size: nextEnrollments.length,
      sample: nextEnrollments.slice(),
    };
  }

  const chunkedEnrollments = chunk(
    nextEnrollments,
    Math.ceil(nextEnrollments.length / 3),
  );

  await nextJobs.dispatch('NextEnrollmentsUpdate', chunkedEnrollments[0]);

  await nextJobs.schedule('NextEnrollmentsUpdate', chunkedEnrollments[1], {
    toWait: '2 minutes',
  });
  await nextJobs.schedule('NextEnrollmentsUpdate', chunkedEnrollments[2], {
    toWait: '4 minutes',
  });

  return reply.send({ published: true, msg: 'Enrollments Synced' });
}

function chunkArray<T>(arr: T[], chunkSize: number) {
  return Array.from({ length: Math.ceil(arr.length / chunkSize) }, (_, i) =>
    arr.slice(i * chunkSize, i * chunkSize + chunkSize),
  );
}
