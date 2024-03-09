import { confirmToken } from '../utils/confirmationToken.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AccountService } from './account.service.js';

export class AccountHandler {
  constructor(private readonly accountService: AccountService) {}

  async confirmNextUser(
    request: FastifyRequest<{ Body: { token: string } }>,
    reply: FastifyReply,
  ) {
    const { token } = request.body;
    const userNotConfirmed = confirmToken(token);
    const user = await this.accountService.findUnique(userNotConfirmed);

    if (!user) {
      return reply.badRequest('User not found');
    }
    user.confirmed = true;
    await user.save();

    return {
      token: user.generateJWT(),
    };
  }

  nextUserInfo(request: FastifyRequest, reply: FastifyReply) {
    const nextUser = request.user;

    if (!nextUser) {
      reply.badRequest('User not found');
    }

    return nextUser;
  }

  async completeNextUser(
    request: FastifyRequest<{ Body: { email: string; ra: number } }>,
    reply: FastifyReply,
  ) {
    const nextSessionUser = request.user;

    if (!nextSessionUser) {
      reply.badRequest('User not found');
    }

    const nextUser = await this.accountService.setNextUfFields(
      request.body,
      nextSessionUser!.email!,
    );

    return nextUser;
  }

  async resendNextEmail(request: FastifyRequest, reply: FastifyReply) {
    const nextUser = await this.accountService.findUniqueSession(
      // @ts-expect-error mongoose
      request.user?._id,
    );
    if (!nextUser) {
      return reply.badRequest('User not found');
    }

    await nextUser.sendConfirmation();
  }
}
