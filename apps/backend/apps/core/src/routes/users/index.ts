import { UserModel, type User } from '@/models/User.js';
import { getEmployeeData, getStudentData } from '@/modules/email-validator.js';
import { completeUserSchema, type Auth } from '@/schemas/auth.js';
import {
  confirmUserSchema,
  deactivateUserSchema,
  loginFacebookSchema,
  resendEmailSchema,
  sendRecoveryEmailSchema,
  validateUserEmailSchema,
} from '@/schemas/user.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  const usersCache = app.cache<Auth>();
  app.get('/info', async (request, reply) => {
    const cachedResponse = usersCache.get(`user:info:${request.user._id}`);
    if (cachedResponse) {
      return cachedResponse;
    }

    const user = await UserModel.findById(request.user._id);
    if (!user) {
      return reply.badRequest('User not found');
    }

    const userInfo = {
      _id: user._id.toString(),
      ra: user.ra,
      active: user.active,
      confirmed: user.confirmed,
      createdAt: user._id.getTimestamp(),
      oauth: user.oauth,
      email: user.email,
      permissions: user.permissions,
    };

    request.log.info(userInfo, 'setting user to cache');
    usersCache.set(`user:info:${request.user._id}`, userInfo);

    return userInfo;
  });
  app.get('/validate/:ra', async (request, reply) => {
    const { ra } = request.params as { ra: string };
    const raNumber = parseInt(ra)
    const user = await UserModel.findOne({ra:raNumber});
    if (!user) {
      return reply.badRequest('User not found');
    }

    const userInfo = {
      ra: user.ra,
      active: user.active,
      confirmed: user.confirmed,
    };

    return userInfo;
  })

  app.post(
    '/facebook',
    { schema: loginFacebookSchema },
    async (request, reply) => {
      const { ra, email } = request.body;
      const user = await UserModel.findOne({
        ra,
        $or: [
          { 'oauth.facebookEmail': email },
          { 'oauth.email': email },
          { 'oauth.emailFacebook': email },
        ],
      });

      if (!user) {
        return reply.notFound('Usuario não encontrado');
      }

      const userEmails = [user.oauth?.emailFacebook, user.oauth?.email].filter(
        Boolean,
      );

      if (!userEmails.includes(email)) {
        throw new Error(
          'Email does not match the registered email for this RA',
        );
      }

      const jwtToken = app.jwt.sign({
        _id: user._id.toJSON(),
        ra: user.ra,
        permissions: user.permissions,
        active: user.active,
        confirmed: user.confirmed,
        email: user.email,
      });

      return { success: true, token: jwtToken };
    },
  );

  app.post('/resend', { schema: resendEmailSchema }, async (request, reply) => {
    const user = await UserModel.findOne({
      _id: request.user._id,
      active: true,
      confirmed: false,
    });

    if (!user) {
      return reply.notFound('User Not Found');
    }

    app.job.dispatch('SendEmail', {
      kind: 'Confirmation',
      user: user.toJSON() as unknown as User & { _id: string },
    });

    return { message: 'E-mail enviado com sucesso' };
  });

  app.put(
    '/complete',
    { schema: completeUserSchema },
    // @ts-ignore
    async (request, reply) => {
      const { email, ra } = request.body;
      try {
        const user = await UserModel.findByIdAndUpdate(
          request.user._id,
          { email, ra },
          { new: true },
        );

        if (!user) {
          return reply.badRequest('Malformed token');
        }

        app.job.dispatch('SendEmail', {
          kind: 'Confirmation',
          user: user.toJSON() as unknown as User & { _id: string },
        });

        return {
          ra: user?.ra,
          email: user?.email,
        };
      } catch (error) {
        request.log.error({ msg: 'error completing user', error });
        return reply.internalServerError('Could not complete user');
      }
    },
  );

  app.post(
    '/confirm',
    { schema: confirmUserSchema },
    async (request, reply) => {
      const { token } = request.body;
      const notConfirmedUser = app.verifyToken(token, app.config);

      if (!notConfirmedUser) {
        return reply.badRequest('Invalid token');
      }
      const { email } = JSON.parse(notConfirmedUser) as { email: string };
      const user = await UserModel.findOne({
        email,
      });
      if (!user) {
        return reply.notFound('User not found');
      }

      user.confirmed = true;

      const confirmedUser = await user.save();

      const jwtToken = app.jwt.sign({
        _id: confirmedUser._id,
        ra: confirmedUser.ra,
        confirmed: confirmedUser.confirmed,
        email: confirmedUser.email,
        permissions: confirmedUser.permissions,
      });

      return {
        token: jwtToken,
      };
    },
  );

  app.delete(
    '/remove',
    { schema: deactivateUserSchema },
    async ({ user }, reply) => {
      const currentUser = await UserModel.findById(user._id);

      if (!currentUser) {
        return reply.notFound('User not found');
      }

      currentUser.active = false;
      await currentUser.save();

      return {
        message: 'Foi bom te ter aqui =)',
      };
    },
  );

  app.get(
    '/check-email',
    { schema: validateUserEmailSchema },
    // @ts-ignore
    async (request, reply) => {
      const { ra } = request.query;

      const checkUser = await getStudentData(ra);

      if (!checkUser) {
        return reply.badRequest(
          'O RA digitado não existe. Por favor, tente novamente',
        );
      }

      const employeePromises = checkUser.email.map(
        async (email) => await getEmployeeData(email),
      );
      const employees = await Promise.all(employeePromises);
      const validEmployees = employees.filter((employee) => employee !== null);

      if (validEmployees.length > 0) {
        request.log.warn('UFABC employee', validEmployees);
        return reply.forbidden(
          'O aluno não pode ter contrato de trabalho com a UFABC',
        );
      }

      return { email: checkUser.email[0] };
    },
  );

  app.post(
    '/recover',
    { schema: sendRecoveryEmailSchema },
    async (request, reply) => {
      const { email } = request.body;
      const user = await UserModel.findOne({ email }).lean<
        User & { _id: string }
      >();

      if (!user) {
        return reply.badRequest(`E-mail inválido: ${email}`);
      }

      await app.job.dispatch('SendEmail', {
        kind: 'Recover',
        user,
      });

      return reply.send({
        msg: 'success',
      });
    },
  );
};

export default plugin;
