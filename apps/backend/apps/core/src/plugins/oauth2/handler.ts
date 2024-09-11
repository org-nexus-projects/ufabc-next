import { Config } from '@/config/config.js';
import { createIfNotExists } from './query.js';
import type { ProviderName, Providers } from './utils/oauthTypes.js';
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
  const user = await createIfNotExists(oauthUser, userId);
  const isUserInApp = inApp.split('?')[0] === 'true';
  const tokenParam = `?token=${user.generateJWT()}`;
  const isWeb = `${Config.WEB_URL}/login${tokenParam}`;
  const redirectURL = isUserInApp ? `ufabcnext://login${tokenParam}` : isWeb;

  return reply.redirect(redirectURL);
}
