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
import { type UserDocument, UserModel, UserRaHistoryModel } from '@/models/User.js';
import { BaseService, type BaseServiceOptions } from '@/services/base-service.js';

const [studentEmailDomain] = UFABC_EMAIL_DOMAINS;

type SigaaSession = { sessionId: string; viewId: string };

export class StudentService extends BaseService {
  constructor(
    private readonly app: any,
    options: BaseServiceOptions = {}
  ) {
    super(options);
  }

  async syncFromSigaa(params: { ra: number; login: string }, sigaaSession: SigaaSession) {
    const { ra, login } = params;
    const studentEmail = `${login}@${studentEmailDomain}`;

    const user = await UserModel.findOne({ email: studentEmail });

    if (!user) {
      this.logger.warn({ studentEmail }, 'user not found for sigaa sync');
      return {
        status: 'not_found',
        message: `Usuário não encontrado para o e-mail ${studentEmail}`,
      } as const;
    }

    const cacheKey = `http:students:sigaa:${ra}`;
    let studentSync = await this.app.db.StudentSync.findOne({ ra: String(ra) });
    const cached = await this.app.redis.get(cacheKey);

    if (cached && studentSync?.status === 'completed') {
      this.logger.debug({ cacheKey }, 'student already synced');
      return { status: 'cached', cacheKey } as const;
    }

    const connector = new UfabcParserConnector(this.globalTraceId);
    await connector.syncStudent({
      sessionId: sigaaSession.sessionId,
      viewId: sigaaSession.viewId,
      requesterKey: this.app.config.UFABC_PARSER_REQUESTER_KEY,
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
        timeline: [{ status: 'created', metadata: { login } }],
      });
    }

    await studentSync.transition('awaiting', { source: 'sigaa', login });
    await this.app.redis.set(cacheKey, login, 'PX', SIGAA_STUDENT_SYNC_CACHE_TTL_MS);

    return { status: 'success', data: { ra: String(ra), login } } as const;
  }

  private async handleRaChange(user: UserDocument, newRa: number) {
    const userWithSameRa = await UserModel.findOne({
      ra: newRa,
      _id: { $ne: user._id },
    });

    if (userWithSameRa) {
      const isRecentChange =
        userWithSameRa.updatedAt !== null &&
        userWithSameRa.updatedAt !== undefined &&
        Date.now() - userWithSameRa.updatedAt.getTime() <
          RECENT_RA_CHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

      if (isRecentChange) {
        return {
          status: 'conflict',
          message:
            'Este RA está associado a um usuário atualizado recentemente. A reatribuição automática foi bloqueada.',
        } as const;
      }

      await this.recordRaHistory(userWithSameRa._id, String(newRa));
      await this.deactivateRecordsForRa(newRa);
      await UserModel.updateOne({ _id: userWithSameRa._id }, { $set: { ra: null } });
    }

    if (user.ra !== null && user.ra !== undefined) {
      await this.recordRaHistory(user._id, String(user.ra));
      await this.deactivateRecordsForRa(user.ra);
    }

    user.ra = newRa;
    await user.save();
    this.logger.info({ userId: user._id, newRa }, 'user ra updated');

    return null;
  }

  private async recordRaHistory(userId: Types.ObjectId, previousRa: string) {
    await UserRaHistoryModel.updateMany(
      { user_id: userId, status: 'current' },
      { $set: { status: 'replaced' } }
    );
    await UserRaHistoryModel.create({ user_id: userId, previous_ra: previousRa });
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
