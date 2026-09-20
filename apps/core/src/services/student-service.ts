import type { FastifyInstance } from 'fastify';
import type { Types } from 'mongoose';

import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import {
  RECENT_RA_CHANGE_WINDOW_DAYS,
  SIGAA_STUDENT_SYNC_CACHE_TTL_MS,
  UFABC_EMAIL_DOMAINS,
} from '@/constants.js';
import { EnrollmentModel } from '@/models/Enrollment.js';
import { GraduationHistoryModel } from '@/models/GraduationHistory.js';
import { HistoryModel } from '@/models/History.js';
import { StudentModel } from '@/models/Student.js';
import { UserModel, UserRaHistoryModel } from '@/models/User.js';
import type { UserDocument } from '@/models/User.js';
import { BaseService } from '@/services/base-service.js';
import type { BaseServiceOptions } from '@/services/base-service.js';

type SigaaSession = { sessionId: string; viewId: string };

export class StudentService extends BaseService {
  private readonly app: FastifyInstance;  
  constructor(
    app: FastifyInstance,
    options: BaseServiceOptions = {}
) {
    super(options);
    this.app = app
    
  }

  async syncFromSigaa(
    params: { ra: number; login: string },
    sigaaSession: SigaaSession
  ) {
    const { ra, login } = params;
    const studentEmail = `${login}@${UFABC_EMAIL_DOMAINS[0]}`;

    const user = await UserModel.findOne({ email: studentEmail });

    if (!user) {
      this.logger.warn({ studentEmail }, 'user not found for sigaa sync');
      return {
        message: `Usuário não encontrado para o e-mail ${studentEmail}`,
        status: 'not_found',
      } as const;
    }

    const cacheKey = `http:students:sigaa:${ra}`;
    let studentSync = await this.app.db.StudentSync.findOne({ ra: String(ra) });
    const cached = await this.app.redis.get(cacheKey);

    if (cached && studentSync?.status === 'completed') {
      this.logger.debug({ cacheKey }, 'student already synced');
      return { cacheKey, status: 'cached' } as const;
    }

    const connector = new UfabcParserConnector(this.globalTraceId);
    await connector.syncStudent({
      requesterKey: this.app.config.UFABC_PARSER_REQUESTER_KEY,
      sessionId: sigaaSession.sessionId,
      viewId: sigaaSession.viewId,
    });

    if (user.ra !== ra) {
      const conflict = await this.handleRaChange(user, ra);
      if (conflict) {
        return conflict;
      }
    }

    if (!studentSync) {
      studentSync = await this.app.db.StudentSync.create({
        ra: String(ra),
        status: 'created',
        timeline: [{ metadata: { login }, status: 'created' }],
      });
    }

    await studentSync.transition('awaiting', { login, source: 'sigaa' });
    await this.app.redis.set(
      cacheKey,
      login,
      'PX',
      SIGAA_STUDENT_SYNC_CACHE_TTL_MS
    );

    return { data: { login, ra: String(ra) }, status: 'success' } as const;
  }

  private async handleRaChange(user: UserDocument, newRa: number) {
    const userWithSameRa = await UserModel.findOne({
      _id: { $ne: user._id },
      ra: newRa,
    });

    if (userWithSameRa) {
      const isRecentChange =
        Date.now() - userWithSameRa.updatedAt.getTime() <
        RECENT_RA_CHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

      if (isRecentChange) {
        return {
          message:
            'Este RA está associado a um usuário atualizado recentemente. A reatribuição automática foi bloqueada.',
          status: 'conflict',
        } as const;
      }

      await this.recordRaHistory(userWithSameRa._id, String(newRa));
      await this.deactivateRecordsForRa(newRa);
      await UserModel.updateOne(
        { _id: userWithSameRa._id },
        { $set: { ra: null } }
      );
    }

    if (user.ra !== null && user.ra !== undefined) {
      await this.recordRaHistory(user._id, String(user.ra));
      await this.deactivateRecordsForRa(user.ra);
    }

    user.ra = newRa;
    await user.save();
    this.logger.info({ newRa, userId: user._id }, 'user ra updated');

    return null;
  }

  private async recordRaHistory(userId: Types.ObjectId, previousRa: string) {
    await UserRaHistoryModel.updateMany(
      { status: 'current', user_id: userId },
      { $set: { status: 'replaced' } }
    );
    await UserRaHistoryModel.create({
      previous_ra: previousRa,
      user_id: userId,
    });
  }

  private async deactivateRecordsForRa(ra: number) {
    await Promise.all([
      EnrollmentModel.updateMany({ ra }, { $set: { active: false } }),
      HistoryModel.updateMany({ ra }, { $set: { active: false } }),
      GraduationHistoryModel.updateMany({ ra }, { $set: { active: false } }),
      StudentModel.updateMany({ ra }, { $set: { active: false } }),
    ]);
  }
}
