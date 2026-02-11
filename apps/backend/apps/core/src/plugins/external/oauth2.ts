import { fastifyOauth2, type OAuth2Namespace } from '@fastify/oauth2';
import { fastifyPlugin as fp } from 'fastify-plugin';

import type { Auth } from '@/schemas/auth.js';

import { REQUESTERS } from '@/constants.js';

declare module 'fastify' {
  interface FastifyInstance {
    google: OAuth2Namespace;
  }
  interface Session {
    user: Auth;
  }
}

export type statePayloadType = {
  userId: string;
  requesterKey: 'ufabc-next' | 'ufabc-cronos';
};

export default fp(
  async (app) => {
    await app.register(fastifyOauth2, {
      name: 'google',
      userAgent: 'UFABC next (2.0.0)',
      credentials: {
        client: {
          id: app.config.OAUTH_GOOGLE_CLIENT_ID,
          secret: app.config.OAUTH_GOOGLE_SECRET,
        },
        auth: fastifyOauth2.GOOGLE_CONFIGURATION,
      },
      scope: ['profile', 'email'],
      callbackUri: (req) =>
        `${app.config.PROTOCOL}://${req.host}/login/google/callback`,
      generateStateFunction: (request) => {
        // @ts-ignore
        const payload = {
          userId: (request.query as any).userId ?? null,
          requesterKey: (request.query as any).requesterKey ?? null,
        };

        return Buffer.from(JSON.stringify(payload)).toString('base64url');
      },
      checkStateFunction: (request) => {
        const { requesterKey } = JSON.parse(
          Buffer.from((request.query as any).state, 'base64url').toString('utf8')
        ) as statePayloadType;

        if (!REQUESTERS.includes(requesterKey))
          throw new Error('Invalid requester key');

        return true;
      },
    });

    app.log.info('[PLUGIN] Oauth');
  },
  { name: 'oauth2' }
);
