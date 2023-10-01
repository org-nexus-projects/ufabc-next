import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Document, ObjectId } from 'mongoose';
import type { User } from '@ufabcnext/types';
import { logger } from '@ufabcnext/common';
import { UfabcUser } from '../schema/signUp.schema.js';

export async function completeUser(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // TODO: Need help to fix this type
    const user = request.user as unknown as Document<ObjectId, unknown, User>;
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
