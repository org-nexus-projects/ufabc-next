import { type Graduation, GraduationModel } from '@/models/Graduation.js';
import { HistoryModel } from '@/models/History.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

type CreateHistoryRequest = {
  Body: {
    ra: number;
    grade: string;
    mandatory_credits_number: number;
    limited_credits_number: number;
    free_credits_number: number;
    credits_total: number;
    curso: string;
  };
};

export async function createHistory(
  request: FastifyRequest<CreateHistoryRequest>,
  reply: FastifyReply,
) {
  const userPortalHistory = request.body;
  const {
    free_credits_number,
    mandatory_credits_number,
    limited_credits_number,
    credits_total,
  } = userPortalHistory;

  if (!userPortalHistory.ra) {
    reply.badRequest('An User RA must be passed');
  }

  // normalize UFABC mistaken name
  if (userPortalHistory.curso === 'Bacharelado em CIências e Humanidades') {
    userPortalHistory.curso = 'Bacharelado em Ciências e Humanidades';
    request.body.curso = 'Bacharelado em Ciências e Humanidades';
  }

  if (userPortalHistory.curso && userPortalHistory.grade) {
    const graduation: Partial<Graduation> = {
      locked: false,
      curso: userPortalHistory.curso,
      grade: userPortalHistory.grade,
    };

    if (mandatory_credits_number > 0) {
      graduation.mandatory_credits_number = mandatory_credits_number;
    }

    if (limited_credits_number > 0) {
      graduation.limited_credits_number = limited_credits_number;
    }

    if (free_credits_number > 0) {
      graduation.free_credits_number = free_credits_number;
    }

    if (credits_total > 0) {
      graduation.credits_total = credits_total;
    }

    const studentGraduation = await GraduationModel.findOne({
      curso: userPortalHistory.curso,
      grade: userPortalHistory.grade,
    }).lean(true);

    if (studentGraduation?.locked) {
      await GraduationModel.findOneAndUpdate(
        {
          curso: userPortalHistory.curso,
          grade: userPortalHistory.grade,
        },
        graduation,
        { new: true, upsert: true },
      );
    }
  }

  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  await HistoryModel.findOneAndUpdate(
    {
      ra: userPortalHistory.ra,
      // Only let update history once per hour
      // since this creates too much propagation on enrollments
      updatedAt: { $lte: oneHourAgo },
    },
    userPortalHistory,
    {
      upsert: true,
      new: true,
    },
  );

  return {
    msg: 'User History Synced',
  };
}
