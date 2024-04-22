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

  nextUserInfo(request: FastifyRequest, reply: FastifyReply) {
    const nextUser = request.user;

    if (!nextUser) {
      return reply.badRequest('User not found');
    }

    return {
      id: nextUser._id,
      ra: nextUser.ra,
      oauth: nextUser.oauth,
      confirmed: nextUser.confirmed,
      active: nextUser.active,
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
    }
  }

  async resendNextEmail(request: FastifyRequest, reply: FastifyReply) {
    const nextUser = await UserModel.findOne({
      _id: request.user?._id,
      active: true,
    });

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
      phone: `${deviceAgent?.vendor}:${deviceAgent?.model} || 'Unparsable'`,
    };

    // @ts-expect-error fix later
    request.user?.addDevice(newDevice);

    await request.user?.save();

    return request.user?.devices;
  }

  async removeUserDevice(
    request: FastifyRequest<{ Params: { deviceId: string } }>,
    reply: FastifyReply,
  ) {
    const user = request.user;
    const { deviceId } = request.params;
    if (!deviceId) {
      return reply.badRequest('Missing deviceId');
    }

    if (!user) {
      return reply.notFound('User not found');
    }

    const isValidDevice = user.devices.find(
      (device) => device.deviceId === deviceId,
    );

    if (!isValidDevice) {
      return reply.badRequest(`Invalid device ${deviceId}`);
    }

    user.removeDevice(deviceId);

    await user.save();

    return user.devices;
  }
}
