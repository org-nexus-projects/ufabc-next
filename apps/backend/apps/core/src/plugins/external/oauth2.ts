import { fastifyPlugin as fp } from 'fastify-plugin';
import {
  fastifyOauth2,
  type OAuth2Namespace,
} from '@fastify/oauth2';
import fastifySession from '@fastify/session';
import fastifyCookie from '@fastify/cookie';
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
    app.register(fastifyCookie);
    // app.register(fastifySession, {
    //   secret: app.config.COOKIE_SECRET,
    //   cookieName: app.config.COOKIE_NAME,
    //   cookie: {
    //     secure: app.config.COOKIE_SECURED,
    //     httpOnly: true,
    //     maxAge: 1800000,
    //   },
    // });
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
    });

    app.log.info('[PLUGIN] Cookie, Session, Oauth');
  },
  { name: 'oauth2' },
);
