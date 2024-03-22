import { logger } from '@next/common';
import { UserModel } from '@/models/index.js';
import type { onRequestAsyncHookHandler } from 'fastify';
import type { JwtHeader, SignPayloadType } from '@fastify/jwt';

type Decoded = {
  header: JwtHeader;
  payload: SignPayloadType;
  signature: string;
  input: string;
};

export const authenticate: onRequestAsyncHookHandler = async (request) => {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new Error('Header de autenticação inválido ou não fornecido');
    }

    // first verify the user;
    await request.jwtVerify();

    const decodedUser = request.server.jwt.decode<Decoded>(token, {
      complete: true,
    });

    request.user = await UserModel.findOne({
      _id: decodedUser?.payload._id,
    });

    if (!request.user?.active) {
      throw new Error('This is account is not active anymore');
    }

    if (!request.user) {
      throw new Error('User does not exist or have been deactivated');
    }
  } catch (error) {
    logger.error(error, 'error authenticating user');
    throw error;
  }
};
