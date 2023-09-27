import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Document, ObjectId } from 'mongoose';
import type { User } from '@ufabcnext/types';
import { logger } from '@ufabcnext/common';
import { Config } from '@config';
import { authenticate } from '@modules/user/hooks/authenticate';
import { ParsedUserToken, UfabcUser } from '../schema/signUp.schema';
import { confirmToken } from '@modules/user/helpers/emailToken';
import { UserModel } from '@ufabcnext/models';

export const autoPrefix = '/v2';
export default async function (app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.put('/users/complete', async (request, reply) => {
    try {
      // TODO: Need help to fix this type
      const user = request.user as unknown as Document<ObjectId, unknown, User>;
      logger.info({ user }, 'show the user');
      const { email, ra } = UfabcUser.parse(request.body);
      if (!user) {
        throw new Error('User not found');
      }

      user.set({ email, ra });
      logger.info({ email, ra }, 'Successfully inserted Email and RA');

      await user.save();
      return reply.send(user);
    } catch (error: unknown) {
      request.log.error({ error }, 'Mongodb error');
      throw error;
    }
  });

  app.post(
    '/users/confirm',
    async (request: FastifyRequest<{ Body: { token: string } }>, reply) => {
      const { token } = request.body;
      logger.info({ token }, 'token on confirm');
      const userNotConfirmed = confirmToken(token, Config.JWT_SECRET);
      if (!token) {
        throw new Error(`Missing Parameter ${token}`);
      }
      try {
        const response = ParsedUserToken.parse(JSON.parse(userNotConfirmed));
        const user = await UserModel.findOne({
          email: response.email,
          active: true,
        });

        if (!user) {
          throw new Error('User not found');
        }

        user.confirmed = true;
        await user.save();

        return reply.send({ token: user.generateJWT() });
      } catch (error) {
        request.log.error({ error }, 'Invalid token');
        throw new Error('Invalid Token');
      }
    },
  );

  app.post('/users/resend', async (request) => {
    const user = await UserModel.findOne({
      _id: request.user?._id,
      active: true,
    });

    if (!user) {
      throw new Error('User Not found');
    }

    await user.sendConfirmation();
  });
}
