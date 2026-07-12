import { currentQuad } from '@next/utils';
import { type FastifyInstance } from 'fastify';

import {
  RaConflictError,
  SessionInvalidError,
  StudentNotFoundError,
  UserNotFoundError,
} from '@/errors/custom-errors.js';
import {
  validateMatriculaToken,
  validateMoodleToken,
  validateSigaaToken,
} from '@/hooks/extension-session.js';
import { type UserDocument, UserModel } from '@/models/User.js';
import { logger } from '@/utils/logger.js';

import { StudentModel } from '../models/Student.js';

type ExtensionTokenSource = 'matricula' | 'sigaa' | 'moodle';

type GenerateExtensionTokenParams = {
  login: string;
  ra?: number;
  source: ExtensionTokenSource;
  sessKey?: string;
  sessionId: string;
  viewId?: string;
};

export class AuthenticationService {
  private readonly config: FastifyInstance['config'];
  private readonly globalTraceId: string;
  private readonly logger: typeof logger;
  private readonly studentModel: typeof StudentModel;
  private readonly userModel: typeof UserModel;
  private readonly jwtService: FastifyInstance['jwt'];

  constructor({
    config,
    globalTraceId,
    jwtService,
  }: {
    config: FastifyInstance['config'];
    globalTraceId: string;
    jwtService: FastifyInstance['jwt'];
  }) {
    this.config = config;
    this.globalTraceId = globalTraceId;
    this.logger = logger.child({ globalTraceId });
    this.studentModel = StudentModel;
    this.userModel = UserModel;
    this.jwtService = jwtService;
  }

  async generateExtensionToken(params: GenerateExtensionTokenParams) {
    const { login, ra, source, sessKey, sessionId, viewId } = params;

    const resolvedRa = await this.resolveRa({ login, ra, source });
    if (resolvedRa === null) {
      this.logger.warn({ login, source }, 'Could not resolve RA');
      throw new StudentNotFoundError();
    }

    const isSessionValid = await this.validateSession({
      sessKey,
      sessionId,
      source,
      viewId,
    });

    if (!isSessionValid) {
      const user = await this.findUserByLogin(login);
      if (
        user &&
        user.ra != null &&
        ra !== undefined &&
        user.ra.toString() === ra.toString()
      ) {
        this.logger.info(
          { login, ra },
          'Session invalid but RA matches linked user; minting token'
        );
        return this.generateToken(user);
      }
      throw new SessionInvalidError();
    }

    const user = await this.findUserByLogin(login);
    if (!user) {
      this.logger.warn({ login }, 'User not found');
      throw new UserNotFoundError();
    }

    return this.generateToken(user);
  }

  async linkUserRa(params: { login: string; ra: number }) {
    const { login, ra } = params;
    const user = await this.findUserByLogin(login);

    if (!user) {
      this.logger.info({ login }, 'No signup user found to link RA');
      return { linked: false, reason: 'user_not_found' };
    }

    if (user.ra != null && user.ra.toString() !== ra.toString()) {
      this.logger.warn(
        { login, ra, userRa: user.ra },
        'RA conflict during user link'
      );
      throw new RaConflictError();
    }

    if (user.ra == null) {
      await this.userModel.updateOne(
        { _id: user._id },
        { $set: { ra } }
      );
      this.logger.info(
        { login, ra, userId: user._id },
        'Linked RA to user during SIGAA init'
      );
      return { linked: true };
    }

    return { linked: false, reason: 'already_linked' };
  }

  private async validateSession(
    params: Omit<GenerateExtensionTokenParams, 'login' | 'ra'>
  ) {
    const { source, sessionId, sessKey, viewId } = params;

    if (source === 'matricula') {
      if (!sessionId) {
        return false;
      }
      return await validateMatriculaToken(
        sessionId,
        this.globalTraceId,
        this.config.UFABC_MATRICULA_URL
      );
    }

    if (source === 'sigaa') {
      if (!viewId) {
        return false;
      }
      return await validateSigaaToken(sessionId, this.globalTraceId);
    }

    if (source === 'moodle') {
      if (!sessKey) {
        return false;
      }
      return await validateMoodleToken(sessionId, sessKey);
    }

    return false;
  }

  private async resolveRa(params: {
    login: string;
    ra?: number;
    source: ExtensionTokenSource;
  }) {
    const { login, ra, source } = params;

    if (ra !== undefined) {
      return ra;
    }

    if (source === 'matricula') {
      const season = currentQuad();
      const student = await this.studentModel.findOne({ login, season });
      return student ? student.ra : null;
    }

    return null;
  }

  private async findUserByLogin(login: string) {
    const possibleEmails = [
      `${login}@aluno.ufabc.edu.br`,
      `${login}@ufabc.edu.br`,
    ];
    const user = await this.userModel
      .findOne({
        email: { $in: possibleEmails },
      })
      .lean<UserDocument>();
    return user;
  }

  private generateToken(user: UserDocument) {
    const token = this.jwtService.sign({
      _id: user._id,
      confirmed: user.confirmed,
      email: user.email,
      permissions: user.permissions,
      ra: user.ra,
    });
    this.logger.info(
      { ra: user.ra, userId: user._id },
      'token exchanged successfully'
    );
    return token;
  }
}
