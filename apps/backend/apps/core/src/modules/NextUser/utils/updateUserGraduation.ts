import { logger } from '@next/common';
import type { HistoryService } from '../history/history.service.js';
import type { Graduation } from '@/models/Graduation.js';

type ExtensionHistory = {
  ra: number;
  grade: string;
  mandatory_credits_number: number;
  limited_credits_number: number;
  free_credits_number: number;
  credits_total: number;
  curso: string;
};

export async function updateUserGraduation(
  extensionHistory: ExtensionHistory,
  historyService: HistoryService,
) {
  const {
    free_credits_number,
    mandatory_credits_number,
    limited_credits_number,
    credits_total,
    grade,
    curso,
  } = extensionHistory;

  const graduation: Partial<Graduation> = {
    locked: false,
    curso,
    grade,
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

  const userGraduation = await historyService.findGraduation(curso, grade);

  if (!userGraduation?.locked) {
    return;
  }

  try {
    logger.info('deu bom');
    await historyService.createUserGraduation(
      {
        grade,
        curso,
      },
      userGraduation,
    );
  } catch (error) {
    logger.warn(error);
    throw error;
  }
}
