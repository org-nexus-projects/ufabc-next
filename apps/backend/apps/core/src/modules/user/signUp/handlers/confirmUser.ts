import type { FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '@ufabcnext/common';
import { UserModel } from '@ufabcnext/models';
import { Config } from '@/config/config.js';
import { ParsedUserToken } from '../schema/signUp.schema.js';
import { confirmToken } from '../../helpers/emailToken.js';

export async function confirmUser(
  request: FastifyRequest<{ Body: { token: string } }>,
  reply: FastifyReply,
) {
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
}
