import { createHash } from 'node:crypto';
import { ofetch } from 'ofetch';
import {
  convertUfabcDisciplinas,
  generateIdentifier,
  logger,
} from '@next/common';
import { updateEnrollmentsQueue } from '@/queue/jobs/enrollmentsUpdate.js';
import { DisciplinaModel, type Enrollment } from '@/models/index.js';
import { type ParseXlSXBody, parseXlsx } from '../utils/parseXlsx.js';
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

  const currentQuadDisciplinas = DisciplinaModel.find({
    season,
  });
  const disciplinas = await currentQuadDisciplinas
    .find(
      {},
      {
        identifier: 1,
        subject: 1,
        teoria: 1,
        pratica: 1,
      },
    )
    .lean({ virtuals: true });

  // @ts-expect-error Experimenting
  const disciplinasMap = new Map([...disciplinas.map((d) => [d._id, d])]);
  const keys = ['ra', 'year', 'quad', 'disciplina'] as const;
  const rawEnrollments = (await parseXlsx(request.body)).map(
    // eslint-disable-next-line unicorn/no-array-callback-reference
    convertUfabcDisciplinas,
  );
  logger.info(rawEnrollments);

  const filteredEnrollments: any[] = rawEnrollments
    .filter((enrollment: Enrollment) => enrollment?.ra)
    .map((studentEnrollment) =>
      Object.assign({}, studentEnrollment, { year, quad }),
    );
  const enrollments = filteredEnrollments.map((enrollment) => {
    const enrollmentIdentifier = generateIdentifier(enrollment);
    // @ts-expect-error Ignore
    const { id, _id, ...disciplinasWithoutId } =
      disciplinasMap.get(enrollmentIdentifier) || {};
    const identifiers = {
      identifier: generateIdentifier(enrollment, keys as any),
      disciplina_identifier: generateIdentifier(enrollment),
    };
    const shallowEnrollment = Object.assign(
      {},
      enrollment,
      identifiers,
      disciplinasWithoutId,
    );

    return shallowEnrollment;
  });

  const enrollmentsHash = createHash('md5')
    .update(JSON.stringify(enrollments))
    .digest('hex');

  if (enrollmentsHash !== hash) {
    return {
      hash: enrollmentsHash,
      size: enrollments.slice(0, 500),
    };
  }

  const chunkSize = Math.ceil(enrollments.length / 3);
  const chunks = [];

  for (let i = 0; i < enrollments.length; i += chunkSize) {
    chunks.push(enrollments.slice(i, i + chunkSize));
  }
  const errors = updateEnrollmentsQueue.add(
    'Enrollments:Update',
    enrollments[0],
    {
      removeOnComplete: true,
    },
  );

  // const TW0_MINUTES = 1_000 * 120;
  // const FOUR_MINUTES = 1_000 * 240;

  // updateEnrollmentsQueue.add(
  //   'Update:Enrollments',
  //   {
  //     json: chunks[1],
  //     enrollmentModel: EnrollmentModel,
  //   },
  //   {
  //     delay: TW0_MINUTES,
  //     removeOnComplete: true,
  //   },
  // );
  // updateEnrollmentsQueue.add(
  //   'Update:Enrollments',
  //   {
  //     json: chunks[1],
  //     enrollmentModel: EnrollmentModel,
  //   },
  //   {
  //     delay: FOUR_MINUTES,
  //     removeOnComplete: true,
  //   },
  // );
  return reply.send({ published: true, errors });
}
