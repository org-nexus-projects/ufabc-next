import { UserModel } from '@/models/User.js';
import { getEmployeeData, getStudentData } from '@/modules/email-validator.js';
import {
  completeUserSchema,
  userAuthSchema,
  type Auth,
} from '@/schemas/auth.js';
import {
  confirmUserSchema,
  deactivateUserSchema,
  loginFacebookSchema,
  resendEmailSchema,
  validateUserEmailSchema,
} from '@/schemas/user.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  const usersCache = app.cache<Auth>();
  app.get('/info', { schema: userAuthSchema }, async (request, reply) => {
    const cachedResponse = usersCache.get(`user:info:${request.user._id}`);
    if (cachedResponse) {
      return cachedResponse;
    }

    const user = await UserModel.findById(request.user._id);
    if (!user) {
      return reply.badRequest('User not found');
    }

    const userInfo = {
      studentId: user._id.toString(),
      ra: user.ra,
      active: user.active,
      confirmed: user.confirmed,
      createdAt: user._id.getTimestamp(),
      oauth: user.oauth,
      email: user.email,
      permissions: user.permissions,
    };

    usersCache.set(`user:info:${request.user._id}`, userInfo);

    return userInfo;
  });

  app.post(
    '/facebook',
    { schema: loginFacebookSchema },
    async (request, reply) => {
      const user = await UserModel.findOne({
        ra: request.body.ra,
        'oauth.emailFacebook': request.body.email,
      });

      if (!user) {
        return reply.notFound('User not found');
      }

      const jwtToken = app.jwt.sign(
        {
          studentId: user._id.toJSON(),
          active: user.active,
          confirmed: user.confirmed,
          email: user.email,
        },
        { expiresIn: '2d' },
      );

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

    app.job.dispatch('SendEmail', user.toJSON());

    return { message: 'E-mail enviado com sucesso' };
  });

  app.put(
    '/complete',
    { schema: completeUserSchema },
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

        app.job.dispatch('SendEmail', user.toJSON());

        return {
          ra: user?.ra,
          email: user?.email,
        };
      } catch {
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

      const jwtToken = app.jwt.sign(
        {
          _id: confirmedUser._id,
          ra: confirmedUser.ra,
          confirmed: confirmedUser.confirmed,
          email: confirmedUser.email,
          permissions: confirmedUser.permissions,
        },
        { expiresIn: '7d' },
      );

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
        return reply.badRequest('User does not exist');
      }

      const employeePromises = checkUser.email.map(
        async (email) => await getEmployeeData(email),
      );
      const employees = await Promise.all(employeePromises);
      const validEmployees = employees.filter((employee) => employee !== null);

      if (validEmployees.length > 0) {
        request.log.warn('UFABC employee', {
          employeeId: validEmployees[0].siape,
          area: validEmployees[0].unidade_exercicio,
          name: validEmployees[0].nome,
        });
        return reply.badRequest('User must not have contract with UFABC');
      }

      return checkUser.email[0];
    },
  );
};

export default plugin;
