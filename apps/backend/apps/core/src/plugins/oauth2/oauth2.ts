import { fastifyOauth2 } from '@fastify/oauth2';
import { fastifyPlugin as fp } from 'fastify-plugin';
import {
  getFacebookUserDetails,
  getGoogleUserDetails,
} from './utils/get-oauth-info.js';
import { objectKeys } from './utils/objectKeys.js';
import { type Querystring, handleOauth } from './handler.js';
import type { Config } from '@/config/config.js';
import type { Providers } from '@next/types';
import type { FastifyInstance, FastifyRequest } from 'fastify';

type NextOauthOptions = {
  googleId: Config['OAUTH_GOOGLE_CLIENT_ID'];
  googleSecret: Config['OAUTH_GOOGLE_SECRET'];
  facebookId: Config['OAUTH_FACEBOOK_CLIENT_ID'];
  facebookSecret: Config['OAUTH_FACEBOOK_SECRET'];
};

async function oauth2(app: FastifyInstance, opts: NextOauthOptions) {
  const providers = {
    google: {
      credentials: {
        client: {
          id: opts.googleId,
          secret: opts.googleSecret,
        },
      },
      config: fastifyOauth2.GOOGLE_CONFIGURATION,
      scope: ['profile', 'email'],
      getUserDetails: getGoogleUserDetails,
    },
    facebook: {
      credentials: {
        client: {
          id: opts.facebookId,
          secret: opts.facebookSecret,
        },
      },
      config: fastifyOauth2.FACEBOOK_CONFIGURATION,
      scope: ['public_profile', 'email'],
      getUserDetails: getFacebookUserDetails,
    },
  } satisfies Providers;

  for (const provider of objectKeys(providers)) {
    const startRedirectPath = `/login/${provider}`;
    const callbackUri = `http://localhost:5000/login/${provider}/callback`;

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
      async function (
        request: FastifyRequest<{ Querystring: Querystring }>,
        reply,
      ) {
        try {
          await handleOauth.call(this, provider, request, reply, providers);
        } catch (error) {
          reply.log.error({ error: error.data.payload }, 'Error in oauth2');
          return error.data.payload;
        }
      },
    );
  }
}

export default fp(oauth2, { name: 'NextOauth2' });
