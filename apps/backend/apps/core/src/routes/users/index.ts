import { UserModel } from '@/models/User.js';
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
} from '@/schemas/user.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  const usersCache = app.cache<Auth>();
  app.get('/info', { schema: userAuthSchema }, async (request, reply) => {
    const decodedStudent = await request.jwtDecode<any>();

    const cachedResponse = usersCache.get(
      `user:info:${decodedStudent.studentId}`,
    );
    if (cachedResponse) {
      return cachedResponse;
    }

    const user = await UserModel.findById(decodedStudent.studentId);
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

    usersCache.set(`user:info:${decodedStudent.studentId}`, userInfo);

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

  app.post(
    '/resend',
    { schema: resendEmailSchema },
    async ({ session }, reply) => {
      const user = await UserModel.findOne({
        _id: session.user.studentId,
        active: true,
        confirmed: false,
      });

      if (!user) {
        return reply.notFound('User Not Found');
      }

      app.job.dispatch('SendEmail', user.toJSON());

      return { message: 'E-mail enviado com sucesso' };
    },
  );

  app.put(
    '/complete',
    { schema: completeUserSchema },
    async (request, reply) => {
      const { email, ra } = request.body;
      const decodedUser = await request.jwtDecode<any>();
      try {
        const user = await UserModel.findByIdAndUpdate(
          decodedUser.studentId,
          { email, ra },
          { new: true },
        );

        return {
          ra,
          email,
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
      const notConfirmedUser = await app.verifyToken(
        token,
        app.config.JWT_SECRET,
      );
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
          studentId: confirmedUser._id.toJSON(),
          active: confirmedUser.active,
          confirmed: confirmedUser.confirmed,
          email: confirmedUser.email,
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
    async ({ session }, reply) => {
      const user = await UserModel.findById(session.user.studentId);

      if (!user) {
        return reply.notFound('User not found');
      }

      user.active = false;
      await user.save();

      return {
        message: 'Foi bom te ter aqui =)',
      };
    },
  );
};

export default plugin;
