import { type FastifyInstance } from 'fastify';

import {
  RaConflictError,
  StudentNotFoundError,
  UserNotFoundError,
} from '@/errors/custom-errors.js';
import { type UserDocument, UserModel } from '@/models/User.js';
import { logger } from '@/utils/logger.js';

import { StudentModel } from '../models/Student.js';

export class AuthenticationService {
  private readonly globalTraceId: string;
  private readonly logger: typeof logger;
  private readonly studentModel: typeof StudentModel;
  private readonly userModel: typeof UserModel = UserModel;
  private readonly jwtService: FastifyInstance['jwt'];

  constructor({
    globalTraceId,
    jwtService,
  }: {
    globalTraceId: string;
    jwtService: FastifyInstance['jwt'];
  }) {
    this.logger = logger.child({ globalTraceId });
    this.studentModel = new StudentModel();
    this.userModel = new UserModel();
    this.jwtService = jwtService;
  }

  async generateMatriculaToken(login: string, season: string) {
    const student = await this.studentModel.findOne({ login, season });

    if (!student) {
      this.logger.warn({ login }, 'Student not found');
      throw new StudentNotFoundError();
    }

    const possibleEmails = [
      `${login}@aluno.ufabc.edu.br`,
      `${login}@ufabc.edu.br`,
    ];
    const user = await this.userModel
      .findOne({
        email: { $in: possibleEmails },
      })
      .lean<UserDocument>();

    if (!user) {
      this.logger.warn({ login }, 'User not found');
      throw new UserNotFoundError();
    }

    if (user.ra.toString() !== student.ra.toString()) {
      this.logger.warn(
        { login, ra: user.ra, studentRa: student.ra },
        'RA mismatch'
      );
      throw new RaConflictError();
    }

    const token = this.generateToken(user);
    return token;
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
