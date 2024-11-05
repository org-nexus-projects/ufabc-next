import UAParser from 'ua-parser-js';
import { z } from 'zod';
import { UserModel } from '@/models/User.js';
import { confirmToken } from '../utils/confirmationToken.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export class AccountHandler {
  async confirmNextUser(
    request: FastifyRequest<{ Body: { token: string } }>,
    reply: FastifyReply,
  ) {
    const { token } = request.body;
    const userNotConfirmed = confirmToken(token);
    const parsedUserToken = z.object({
      email: z.string().email(),
    });
    const response = parsedUserToken.parse(JSON.parse(userNotConfirmed));
    const user = await UserModel.findOne({
      email: response.email,
    });

    if (!user) {
      return reply.badRequest('User not found');
    }
    user.confirmed = true;
    await user.save();

    return {
      token: user.generateJWT(),
    };
  }

  async completeNextUser(
    request: FastifyRequest<{ Body: { email: string; ra: number } }>,
    reply: FastifyReply,
  ) {
    const user = request.user;
    if (!user) {
      return reply.notFound('User not found');
    }
    const student = z.object({
      email: z.string().email(),
      ra: z.number(),
    });

    const { email, ra } = student.parse(request.body);

    user.set({ email, ra });

    await user.save();

    return {
      ra: user.ra,
      email: user.email,
    };
  }
}
