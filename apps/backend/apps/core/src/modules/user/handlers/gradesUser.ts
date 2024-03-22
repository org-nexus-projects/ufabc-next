import { calculateCoefficients } from '@next/common';
import { type Graduation, GraduationModel } from '@/models/Graduation.js';
import {
  type GraduationHistory,
  GraduationHistoryModel,
} from '@/models/GraduationHistory.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export async function gradesUser(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;

  // This code is necessary for show data to performance page - get the coefficients from the last history
  // Example: users with BCT concluded and BCC in progress will have the BCC coefficients showed on the performance screen.
  const lastUserHistory = await GraduationHistoryModel.findOne({
    ra: user?.ra,
  }).sort({ createdAt: -1 });

  // Next step
  //Needs to add a querie to get the coefficients from the first historyGraduatiation and show that on the performance screen.
  // that already exists its this endpoint  `/graduation/histories`

  if (!lastUserHistory) {
    return reply.notFound('History not found');
  }

  let graduation = null;
  if (lastUserHistory.curso && lastUserHistory.grade) {
    graduation = await GraduationModel.findOne({
      curso: lastUserHistory.curso,
      grade: lastUserHistory.grade,
    }).lean<Graduation>(true);
  }

  const coefficients =
    lastUserHistory.coefficients ||
    calculateCoefficients(lastUserHistory.disciplinas || [], graduation);

  const normalizedHistory = normalizeHistory(coefficients);

  return reply.status(200).send(normalizedHistory);
}

const normalizeHistory = (history: GraduationHistory['coefficients']) => {
  const total = [];

  for (const graduationYear of Object.keys(history)) {
    const graduationQuad = history[Number.parseInt(graduationYear)];

    for (const month of Object.keys(graduationQuad)) {
      total.push(
        // @ts-expect-error Ignore for now
        Object.assign(graduationQuad[Number.parseInt(month)], {
          season: `${graduationYear}:${month}`,
          quad: Number.parseInt(month),
          year: Number.parseInt(graduationYear),
        }),
      );
    }
  }

  return total;
};
