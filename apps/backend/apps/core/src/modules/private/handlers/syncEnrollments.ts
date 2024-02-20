import { createHash } from 'node:crypto';
import { ofetch } from 'ofetch';
import { convertUfabcDisciplinas, generateIdentifier } from '@next/common';
import { omit as LodashOmit } from 'lodash-es';
import { updateEnrollments } from '@/queue/jobs/enrollmentsUpdate.js';
import { type Disciplina, DisciplinaModel } from '@/models/index.js';
import { type ParseXlSXBody, parseXlsx } from '../../utils/parseXlsx.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export type SyncEnrollmentsRequest = {
  Body: ParseXlSXBody & {
    hash: string;
    year: number;
    quad: number;
  };
};

export async function syncEnrollments(
  request: FastifyRequest<SyncEnrollmentsRequest>,
  reply: FastifyReply,
) {
  const { hash, year, quad, link } = request.body;

  if (!year || !quad) {
    throw new Error(`Missing Parameters`, {
      cause: {
        year,
        quad,
      },
    });
  }

  const season = `${year}:${quad}`;

  const doesLinkExist = await ofetch(link, {
    method: 'OPTIONS',
  });

  if (!doesLinkExist) {
    throw new Error(`O link enviado deve existir`, { cause: link });
  }

  const disciplinasMapper = {
    identifier: 1,
    subject: 1,
    teoria: 1,
    pratica: 1,
  };

  const disciplinas = await DisciplinaModel.find(
    { season },
    disciplinasMapper,
  ).lean<Disciplina[]>({ virtuals: true });

  const disciplinasMapping = new Map<string, Disciplina>(
    disciplinas.map((d) => [d.identifier, d]),
  );

  const keys = ['ra', 'year', 'quad', 'disciplina'] as const;

  const sheetEnrollments = await parseXlsx(request.body);
  const rawEnrollments = sheetEnrollments.map((sheetEnrollment) =>
    convertUfabcDisciplinas(sheetEnrollment),
  );

  const userEnrollments = rawEnrollments.filter(
    //@ts-expect-error
    (enrollment) => enrollment.ra && enrollment.disciplina,
  );

  const assignYearAndQuadToEnrollments = userEnrollments.map(
    (userEnrollments) => Object.assign(userEnrollments, { year, quad }),
  );

  const enrollments = assignYearAndQuadToEnrollments.map((enrollment) => {
    const enrollmentIdentifier = generateIdentifier(enrollment);
    const neededDisciplinasFields = LodashOmit(
      disciplinasMapping.get(enrollmentIdentifier) || {},
      ['id', '_id'],
    );
    return Object.assign(neededDisciplinasFields, {
      identifier: generateIdentifier(enrollment, keys as any),
      disciplina_identifier: generateIdentifier(enrollment),
      ...enrollment,
    });
  });

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
  await updateEnrollments(enrollments);
  return reply.send({ published: true, msg: 'Enrollments Synced' });
}
