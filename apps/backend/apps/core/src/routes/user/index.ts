import { UserModel } from '@/models/User.js';
import { userAuthSchema } from '@/schemas/auth.js';
import {
  deactivateUserSchema,
  loginFacebookSchema,
  resendEmailSchema,
} from '@/schemas/user.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/info', { schema: userAuthSchema }, ({ session }) => session.user);

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
