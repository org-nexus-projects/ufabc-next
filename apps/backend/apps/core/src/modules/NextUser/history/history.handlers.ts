import { type currentQuad, findIds } from '@next/common';
import { type Student, StudentModel } from '@/models/Student.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { HistoryService } from './history.service.js';

// type UserHistoryRequest = {
//   Body: {
//     ra: number;
//     grade: string;
//     mandatory_credits_number: number;
//     limited_credits_number: number;
//     free_credits_number: number;
//     credits_total: number;
//     curso: string;
//   };
// };

type UserHistoryRequest = {
  Body: {
    updateTime: Date;
    curso: string; //"CIÊNCIA E TECNOLOGIA/PROGRAD/BI - SANTO ANDRÉ - BACHARELADO - N";
    ra: string;
    disciplinas: Array<{
      ano: string;
      periodo: string;
      codigo: string;
      situacao: string | '--';
      resultado: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'O';
    }>;
  };
};

export class HistoryHandler {
  constructor(private readonly historyService: HistoryService) { }

  async userHistory(
    request: FastifyRequest<UserHistoryRequest>,
    reply: FastifyReply,
  ) {
    const extensionHistory = request.body;

    let aggregateHistories = {
      extension: extensionHistory,
      grade: '2017',
    };

    if (!extensionHistory.ra) {
      reply.badRequest('An user RA must be passed');
    }

    // @ts-expect-error fix later
    const cleanedCourseName = this.normalizeCourseName(extensionHistory.curso);
    extensionHistory.curso = cleanedCourseName;
    const shouldUpdateGraduation =
      !!aggregateHistories.extension.curso && !!aggregateHistories.grade;

    if (shouldUpdateGraduation) {
      // @ts-expect-error fix later
      await this.updateUserGraduation(extensionHistory, this.historyService);
    }

    await this.historyService.createUserHistory(aggregateHistories);

    return {
      msg: 'UserHistory Synced',
    };
  }

  async historiesCourses(
    request: FastifyRequest<{
      Querystring: { season: ReturnType<typeof currentQuad> };
    }>,
  ) {
    const { season } = request.query;
    const seasonCourses = await findIds<Student>(StudentModel, season);
    return seasonCourses;
  }
}
