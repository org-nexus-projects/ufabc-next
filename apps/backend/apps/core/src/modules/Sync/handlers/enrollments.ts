// @ts-nocheck - work in progress
import { createHash } from 'node:crypto';
import { ofetch } from 'ofetch';
import { generateIdentifier } from '@next/common';
import { omit as LodashOmit } from 'lodash-es';
import { ComponentModel, type Component } from '@/models/Disciplina.js';
import { nextJobs } from '@/queue/NextJobs.js';
import { z } from 'zod';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ufProcessor, type StudentComponent } from '@/services/ufprocessor.js';

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
  }).lean({ virtuals: true });

  const componentsMap = new Map<string, (typeof components)[number]>(
    components.map((component) => [component.identifier, component]),
  );

  const keys = ['ra', 'year', 'quad', 'disciplina'] as const;
  const enrollments = await ufProcessor.getEnrollments(link);
  const kvEnrollments = Object.entries(enrollments);
  const tenantEnrollments = kvEnrollments.map(([ra, studentComponents]) => {
    const hydratedStudentComponents = hydrateComponent(
      studentComponents,
      components,
    );

    return {
      ra,
      year: Number(tenantYear),
      quad: Number(tenantQuad),
      season,
      components: hydratedStudentComponents,
    };
  });
  const nextEnrollments = tenantEnrollments.map((enrollment) => {
    const enrollmentIdentifier = generateIdentifier(enrollment);
    const wanted = componentsMap.get(enrollmentIdentifier) || {};
    return Object.assign(wanted, {
      identifier: generateIdentifier(enrollment, keys),
      disciplina_identifier: enrollmentIdentifier,
      ...LodashOmit(enrollment, Object.keys(wanted)),
    });
  });

  const enrollmentsHash = createHash('md5')
    .update(JSON.stringify(nextEnrollments))
    .digest('hex');

  if (enrollmentsHash !== hash) {
    return {
      hash: enrollmentsHash,
      size: nextEnrollments.length,
      sample: nextEnrollments.slice(0, 500),
    };
  }

  const chunkedEnrollments = chunkArray(nextEnrollments, 1000);

  for (const chunk of chunkedEnrollments) {
    await nextJobs.dispatch('NextEnrollmentsUpdate', chunk);
  }

  return reply.send({ published: true, msg: 'Enrollments Synced' });
}

function chunkArray<T>(arr: T[], chunkSize: number) {
  return Array.from({ length: Math.ceil(arr.length / chunkSize) }, (_, i) =>
    arr.slice(i * chunkSize, i * chunkSize + chunkSize),
  );
}

type HydratedComponent = {
  nome: string;
  campus: Component['campus'];
  turno: Component['turno'];
  turma: string;
  disciplina: string;
  teoria: string | null;
  pratica: string | null;
  year: number;
  quad: 1 | 2 | 3;
};

function hydrateComponent(
  components: StudentComponent[],
  nextComponents: Component[],
): HydratedComponent[] {
  const result = [] as HydratedComponent[];
  const errors = [];
  const nextComponentsMap = new Map<string, Component>();

  for (const nextComponent of nextComponents) {
    nextComponentsMap.set(nextComponent.disciplina, nextComponent);
  }

  for (const component of components) {
    const nextComponent = nextComponentsMap.get(component.name);
    if (!nextComponent) {
      errors.push(nextComponent);
    }

    result.push({
      disciplina: nextComponent?.disciplina,
      nome: component.name,
      campus: nextComponent?.campus,
      pratica: nextComponent?.pratica,
      quad: nextComponent?.quad,
      teoria: nextComponent?.teoria,
      turma: nextComponent?.turma,
      turno: nextComponent?.turno,
      year: nextComponent?.year,
    });
  }

  return result;
}
