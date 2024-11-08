import { UserModel } from '@/models/User.js';
import {
  completeUserSchema,
  userAuthSchema,
  type Auth,
} from '@/schemas/auth.js';
import {
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

      request.session.user = {
        studentId: user._id.toJSON(),
        active: user.active,
        confirmed: user.confirmed,
        createdAt: user._id.getTimestamp().toString(),
        oauth: user.oauth,
        permissions: user.permissions,
        ra: user.ra,
        studentEmail: user.email,
      };

      await request.session.save();
      return { success: true };
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

      const emailQueue = app.queueManager.getQueue('send:email');

      emailQueue?.add('resend-email', {
        app,
        job: user,
      });

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
        const emailQueue = app.queueManager.getQueue('send:email');
        emailQueue?.add('resend-email', user?.toJSON());
        return {
          ra,
          email,
        };
      } catch {
        return reply.internalServerError('Could not complete user');
      }
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
