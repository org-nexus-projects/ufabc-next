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

  const isDev = Config.NODE_ENV === 'dev';
  const isUserInApp = inApp.split('?')[0] === 'true';

  const webUrl = isDev ? Config.WEB_URL_LOCAL : Config.WEB_URL;
  const tokenParam = `?token=${user.generateJWT()}`;
  const isWeb = `${webUrl}/login${tokenParam}`;
  const redirectURL = isUserInApp ? `ufabcnext://login${tokenParam}` : isWeb;

  return reply.redirect(redirectURL);
}
