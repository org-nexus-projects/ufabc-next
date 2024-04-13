import UAParser from 'ua-parser-js';
import { UserModel } from '@/models/User.js';
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

  async disableUserAccount(request: FastifyRequest, reply: FastifyReply) {
    const user = await UserModel.findOne({
      _id: request.user?._id,
      active: true,
    });

    if (!user) {
      return reply.badRequest('User not found');
    }

    user.active = false;
    await user.save();

    return {
      message: 'Foi bom te ter aqui =)',
    };
  }

  async setUserDevice(
    request: FastifyRequest<{
      Body: {
        deviceId: string;
        token: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const { deviceId, token } = request.body;
    if (!deviceId) {
      return reply.badRequest('Missing User deviceId');
    }

    if (!token) {
      return reply.badRequest('missing token');
    }

    const userAgent = new UAParser(request.headers['user-agent']);
    const deviceAgent = userAgent.getDevice();

    const newDevice = {
      deviceId,
      token,
      phone: `${deviceAgent?.vendor}:${deviceAgent?.model} || 'Unparseable'`,
    };

    // @ts-expect-error fix later
    request.user?.addDevice(newDevice);

    await request.user?.save();

    return request.user?.devices;
  }
}
