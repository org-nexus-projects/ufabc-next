import { logger } from '@next/common';
import { UfabcUser } from '../sign-up-schema.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export async function completeUser(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // TODO: Need help to fix this type
    const user = request.user;
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
}
