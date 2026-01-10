import { fastifyOauth2, type OAuth2Namespace } from '@fastify/oauth2';
import { fastifyPlugin as fp } from 'fastify-plugin';

import type { Auth } from '@/schemas/auth.js';

declare module 'fastify' {
  interface FastifyInstance {
    google: OAuth2Namespace;
  }
  interface Session {
    user: Auth;
  }
}

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
        return request.query.userId;
      },
      checkStateFunction: () => true,
    });

    app.log.info('[PLUGIN] Oauth');
  },
  { name: 'oauth2' }
);
