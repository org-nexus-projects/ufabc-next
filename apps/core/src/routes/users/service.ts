import type { FastifyBaseLogger, FastifyInstance } from 'fastify';

import { httpErrors } from '@fastify/sensible';
import { currentQuad } from '@next/utils';

import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { UfabcParserError } from '@/errors/ufabc-parser.js';
import { StudentModel } from '@/models/Student.js';
import { UserModel, type User } from '@/models/User.js';

type JwtSigner = Pick<FastifyInstance['jwt'], 'sign'>;
type JobDispatcher = Pick<FastifyInstance['job'], 'dispatch'>;

type CompleteUserBody = {
  email: string;
  ra?: unknown;
};

type ConfirmUserDependencies = {
  config: FastifyInstance['config'];
  jwt: JwtSigner;
  verifyToken: FastifyInstance['verifyToken'];
};

export async function buildUserInfo(userId: string) {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw httpErrors.badRequest('User not found');
  }

  const season = currentQuad();
  const isUserSynced = await StudentModel.exists({
    ra: user.ra,
    season,
  });

  const userInfo = {
    _id: user._id.toString(),
    ra: user.ra,
    active: user.active,
    confirmed: user.confirmed,
    createdAt: user._id.getTimestamp(),
    oauth: user.oauth,
    email: user.email,
    permissions: user.permissions,
    isSynced: !!isUserSynced,
  };

  return userInfo;
}

export async function validateUserRa(ra: string) {
  const raNumber = Number.parseInt(ra);
  const user = await UserModel.findOne({ ra: raNumber });
  if (!user) {
    throw httpErrors.badRequest('User not found');
  }

  const userInfo = {
    ra: user.ra,
    active: user.active,
    confirmed: user.confirmed,
  };

  return userInfo;
}

export async function loginWithFacebook(
  jwt: JwtSigner,
  body: { ra: number; email: string }
) {
  const { ra, email } = body;
  const user = await UserModel.findOne({
    ra,
    $or: [
      { 'oauth.facebookEmail': email },
      { 'oauth.email': email },
      { 'oauth.emailFacebook': email },
    ],
  });

  if (!user) {
    throw httpErrors.notFound('Usuario não encontrado');
  }

  const userEmails = [user.oauth?.emailFacebook, user.oauth?.email].filter(
    Boolean
  );

  if (!userEmails.includes(email)) {
    throw new Error('Email does not match the registered email for this RA');
  }

  const jwtToken = jwt.sign({
    _id: user._id.toJSON(),
    ra: user.ra,
    permissions: user.permissions,
    active: user.active,
    confirmed: user.confirmed,
    email: user.email,
  });

  return { success: true, token: jwtToken };
}

export async function resendConfirmation(job: JobDispatcher, userId: string) {
  const user = await UserModel.findOne({
    _id: userId,
    active: true,
    confirmed: false,
  });

  if (!user) {
    throw httpErrors.notFound('User Not Found');
  }

  void job.dispatch('SendEmail', {
    kind: 'Confirmation',
    user: user.toJSON() as unknown as User & { _id: string },
  });

  return { message: 'E-mail enviado com sucesso' };
}

export async function completeUser(
  dependencies: { job: JobDispatcher; jwt: JwtSigner },
  userId: string,
  body: CompleteUserBody,
  log: FastifyBaseLogger,
  traceId: string
) {
  const { email, ra } = body;
  const ufabcParserConnector = new UfabcParserConnector(traceId);
  let validationFailure: Error | undefined;

  try {
    const student = await ufabcParserConnector.getStudent(String(ra));
    const hasUfabcContract = await ufabcParserConnector.getTeacher(
      student.login
    );

    if (hasUfabcContract) {
      validationFailure = httpErrors.forbidden(
        'O aluno não pode ter contrato com a UFABC.'
      );
    } else if (Array.isArray(student.email)) {
      const normalizedEmail = email.toLowerCase();
      const emailMatch = student.email.find(
        (e) => e.toLowerCase() === normalizedEmail
      );
      if (!emailMatch) {
        validationFailure = httpErrors.badRequest(
          'O email informado não corresponde ao email institucional vinculado ao RA.'
        );
      } else if (student.email.length > 1) {
        log.warn({
          msg: 'User has multiple emails due to employment contract with UFABC or post graduation',
          ra,
          emails: student.email,
        });
      }
    } else {
      log.error({
        msg: 'student.email is not an array',
        ra,
        studentEmail: student.email,
      });
      validationFailure = httpErrors.internalServerError(
        'Dados do aluno inválidos. Tente novamente mais tarde.'
      );
    }
  } catch (error: unknown) {
    log.error({ msg: 'error validating student', error });
    if (error instanceof UfabcParserError) {
      if (error.code === 'UFP0015') {
        validationFailure = httpErrors.badRequest('O RA digitado não existe.');
      } else if (error.code === 'UFP0031') {
        return;
      } else {
        validationFailure = httpErrors.internalServerError();
      }
    } else {
      validationFailure = httpErrors.internalServerError(
        'Erro de validação inesperado'
      );
    }
  }

  if (validationFailure) {
    throw validationFailure;
  }

  let completionFailure: Error;

  try {
    const ttlHours = 1;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { email: email.toLowerCase(), ra, expiresAt },
      { runValidators: true, new: true }
    );

    if (!user) {
      completionFailure = httpErrors.badRequest('Malformed token');
    } else if (user.oauth?.email === user.email) {
      user.confirmed = true;
      user.expiresAt = null;

      const confirmedUser = await user.save();

      const jwtToken = dependencies.jwt.sign({
        _id: confirmedUser._id,
        ra: confirmedUser.ra,
        confirmed: confirmedUser.confirmed,
        email: confirmedUser.email,
        permissions: confirmedUser.permissions,
      });

      return {
        token: jwtToken,
      };
    } else {
      void dependencies.job.dispatch('SendEmail', {
        kind: 'Confirmation',
        user: user.toJSON() as unknown as User & { _id: string },
      });

      return {
        ra: user.ra as number,
        email: user.email as string,
      };
    }
  } catch (error) {
    log.error({ msg: 'error completing user', error });
    completionFailure = httpErrors.internalServerError(
      'Could not complete user'
    );
  }

  throw completionFailure;
}

export async function confirmUser(
  dependencies: ConfirmUserDependencies,
  token: string
) {
  const notConfirmedUser = dependencies.verifyToken(
    token,
    dependencies.config
  );

  if (!notConfirmedUser) {
    throw httpErrors.badRequest('Invalid token');
  }
  const { email } = JSON.parse(notConfirmedUser) as { email: string };
  const user = await UserModel.findOne({
    email,
  });
  if (!user) {
    throw httpErrors.notFound('User not found');
  }

  user.confirmed = true;
  user.expiresAt = null;

  const confirmedUser = await user.save();

  const jwtToken = dependencies.jwt.sign({
    _id: confirmedUser._id,
    ra: confirmedUser.ra,
    confirmed: confirmedUser.confirmed,
    email: confirmedUser.email,
    permissions: confirmedUser.permissions,
  });

  return {
    token: jwtToken,
  };
}

export async function deactivateUser(userId: string) {
  const currentUser = await UserModel.findById(userId);

  if (!currentUser) {
    throw httpErrors.notFound('User not found');
  }

  currentUser.active = false;
  await currentUser.save();

  return {
    message: 'Foi bom te ter aqui =)',
  };
}

export async function checkUserEmail(
  ra: string,
  log: FastifyBaseLogger,
  traceId: string
) {
  const ufabcParserConnector = new UfabcParserConnector(traceId);
  let failure: Error;

  try {
    const student = await ufabcParserConnector.getStudent(ra);
    await ufabcParserConnector.getTeacher(student.login);

    if (Array.isArray(student.email)) {
      const email =
        student.email.find((e) => e.endsWith('@aluno.ufabc.edu.br')) ??
        student.email.find((e) => e.endsWith('@ufabc.edu.br'));
      return { email: email! };
    }

    log.error({
      msg: 'student.email is not an array',
      ra,
      studentEmail: student.email,
    });
    failure = httpErrors.internalServerError(
      'Dados do aluno inválidos. Tente novamente mais tarde.'
    );
  } catch (error) {
    log.error({ msg: 'error checking email', error });
    if (error instanceof UfabcParserError && error.code === 'UFP0015') {
      failure = httpErrors.badRequest(
        'O RA digitado não existe. Por favor, tente novamente'
      );
    } else if (error instanceof UfabcParserError && error.code === 'UFP0031') {
      failure = httpErrors.forbidden(
        'O aluno não pode ter contrato de trabalho com a UFABC'
      );
    } else {
      failure = httpErrors.internalServerError();
    }
  }

  throw failure;
}

export async function recoverAccount(job: JobDispatcher, email: string) {
  const user = await UserModel.findOne({ email }).lean<
    User & { _id: string }
  >();

  if (!user) {
    throw httpErrors.badRequest(`E-mail inválido: ${email}`);
  }

  await job.dispatch('SendEmail', {
    kind: 'Recover',
    user,
  });

  return {
    msg: 'success',
  };
}
