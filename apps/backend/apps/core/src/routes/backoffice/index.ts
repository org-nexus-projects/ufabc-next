import { UserModel } from '@/models/User.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { z } from 'zod';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    '/token',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
        }),
      },
      preHandler: (request, reply) => request.isAdmin(reply),
    },
    async (request, reply) => {
      const { email } = request.body;

      app.log.warn(request.body);

      const user = await UserModel.findOne({
        email,
      });

      if (!user) {
        return reply.notFound('User not found');
      }

      const token = app.jwt.sign(
        {
          _id: user._id,
          ra: user.ra,
          email: user.email,
          permissions: user.permissions ?? [],
        },
        { expiresIn: '2h' },
      );

      return {
        token,
      };
    },
  );
};

export default plugin;
