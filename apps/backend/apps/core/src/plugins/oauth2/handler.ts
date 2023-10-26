import { WEB_URL, WEB_URL_LOCAL } from '@next/constants';
import { UserModel } from '@next/models';
import { Config } from '@/config/config.js';
import type { ProviderName, Providers } from '@next/types';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export type Querystring = {
  inApp: string;
  userId: string;
};

export async function handleOauth(
  this: FastifyInstance,
  provider: ProviderName,
  request: FastifyRequest<{ Querystring: Querystring }>,
  reply: FastifyReply,
  providers: Providers,
) {
  const { inApp = '', userId = '' } = request.query;
  const { token } =
    await this[provider].getAccessTokenFromAuthorizationCodeFlow(request);
  const oauthUser = await providers[provider].getUserDetails(token);
  const findUserQuery: Record<string, unknown>[] = [
    { 'oauth.providerId': oauthUser.providerId },
  ];

  if (userId) {
    findUserQuery.push({ _id: userId.split('?')[0] });
  }

  let user = await UserModel.findOne({
    $or: findUserQuery,
  });

  if (user) {
    if (userId) {
      user.set('active', true);
    }
    user.set({
      'oauth.providerId': oauthUser.providerId,
      'oauth.email': oauthUser.email,
      'oauth.provider': oauthUser.provider,
    });
  } else {
    user = new UserModel({
      oauth: {
        email: oauthUser.email,
        providerId: oauthUser.providerId,
        provider: oauthUser.provider,
      },
    });
  }

  await user.save();

  const isLocal =
    Config.NODE_ENV === 'dev'
      ? `${WEB_URL_LOCAL}/login?token=${user.generateJWT()}`
      : `${WEB_URL}/login/token=${user.generateJWT()}`;

  const isMobile =
    inApp.split('?')[0] === 'true'
      ? `ufabcnext://login?token=${user.generateJWT()}`
      : isLocal;

  const redirectTo = isMobile || isLocal;
  return reply.redirect(redirectTo);
}
