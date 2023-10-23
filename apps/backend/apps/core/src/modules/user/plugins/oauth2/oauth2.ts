import { fastifyOauth2 } from '@fastify/oauth2';
import { UserModel } from '@ufabcnext/models';
import { WEB_URL, WEB_URL_LOCAL } from '@next/constants';
import {
  getFacebookUserDetails,
  getGoogleUserDetails,
} from './utils/get-oauth-info.js';
import { objectKeys } from './utils/objectKeys.js';
import type { Providers } from '@ufabcnext/types';
import type { Config } from '@/config/config.js';
import type { FastifyInstance, FastifyRequest } from 'fastify';

type Query = {
  // Is User in mobile
  inApp: string;
  // The user _id property from mongoose
  // wouldn't it be better to use the providerId
  userId: string;
};

// TODO: implement session token
export default async function oauth2(app: FastifyInstance, opts: Config) {
  const providers = {
    google: {
      credentials: {
        client: {
          id: opts.OAUTH_GOOGLE_CLIENT_ID,
          secret: opts.OAUTH_GOOGLE_SECRET,
        },
      },
      config: fastifyOauth2.GOOGLE_CONFIGURATION,
      scope: ['profile', 'email'],
      getUserDetails: getGoogleUserDetails,
    },
    facebook: {
      credentials: {
        client: {
          id: opts.OAUTH_FACEBOOK_CLIENT_ID,
          secret: opts.OAUTH_FACEBOOK_SECRET,
        },
      },
      config: fastifyOauth2.FACEBOOK_CONFIGURATION,
      scope: ['public_profile', 'email'],
      getUserDetails: getFacebookUserDetails,
    },
  } satisfies Providers;

  for (const provider of objectKeys(providers)) {
    const startRedirectPath = `/login/${provider}`;
    const callbackUri = `http://localhost:5000/v2/login/${provider}/callback`;

    await app.register(fastifyOauth2, {
      name: provider,
      credentials: {
        client: {
          id: providers[provider].credentials.client.id,
          secret: providers[provider].credentials.client.secret,
        },
        auth: providers[provider].config,
      },
      scope: providers[provider].scope,
      startRedirectPath,
      callbackUri,
    });

    app.get(
      `/login/${provider}/callback`,
      async function (request: FastifyRequest<{ Querystring: Query }>, reply) {
        try {
          const { inApp = '', userId = '' } = request.query;
          const { token } =
            await this[provider].getAccessTokenFromAuthorizationCodeFlow(
              request,
            );
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
            opts.NODE_ENV === 'dev'
              ? `${WEB_URL_LOCAL}/login?token=${user.generateJWT()}`
              : `${WEB_URL}/login/token=${user.generateJWT()}`;

          const isMobile =
            inApp.split('?')[0] === 'true'
              ? `ufabcnext://login?token=${user.generateJWT()}`
              : isLocal;

          const redirectTo = isMobile || isLocal;
          return reply.redirect(redirectTo);
        } catch (error) {
          reply.log.error({ error }, 'Error in oauth2');
          return reply.send(error);
        }
      },
    );
  }
}
