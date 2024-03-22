import type { Graduation } from '@/models/Graduation.js';
import type { History } from '@/models/History.js';
import type { HistoryRepository } from './history.repository.js';

// later validate the usage of zod here, to offload the handler and validate closer to the db
// thoughts @santana?

export class HistoryService {
  constructor(private readonly historyRepository: HistoryRepository) {}

  // its partial cause there maybe some scrapping problems
  async createUserHistory(userPortalHistory: Partial<History>) {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    await this.historyRepository.findOneAndUpdate(
      {
        ra: userPortalHistory?.ra,
        updatedAt: { $lte: oneHourAgo },
      },
      userPortalHistory,
      {
        returnOriginal: false,
        upsert: true,
      },
    );
  }

  async findGraduation(curso: string, grade: string) {
    const userGraduation = await this.historyRepository.findOneGraduation({
      curso,
      grade,
    });
    return userGraduation;
  }

  // if user already has an history, create his graduation
  async createUserGraduation(
    userPortalHistory: Partial<History>,
    userGraduation: Graduation,
  ) {
    await this.historyRepository.findOneAndUpdateGraduation(
      {
        curso: userPortalHistory.curso,
        grade: userPortalHistory.grade,
      },
      userGraduation,
      { returnOriginal: false, upsert: true },
    );
  }
}
