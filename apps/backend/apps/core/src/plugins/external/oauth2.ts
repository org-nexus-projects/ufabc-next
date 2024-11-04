import { fastifyPlugin as fp } from 'fastify-plugin';
import {
  fastifyOauth2,
  type OAuth2Namespace,
  type Token,
} from '@fastify/oauth2';
import fastifySession from '@fastify/session';
import fastifyCookie from '@fastify/cookie';
import type { Auth } from '@/schemas/auth.js';
import { loginSchema } from '@/schemas/login.js';
import type { FastifyZodOpenApiTypeProvider } from 'fastify-zod-openapi';
import { FetchError, ofetch } from 'ofetch';
import type { LegacyGoogleUser } from '../oauth2/utils/oauthTypes.js';
import { UserModel, type User } from '@/models/User.js';
import { Types, type ObjectId } from 'mongoose';

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
    app.register(fastifySession, {
      secret: app.config.COOKIE_SECRET,
      cookieName: app.config.COOKIE_NAME,
      cookie: {
        secure: app.config.COOKIE_SECURED,
        httpOnly: true,
        maxAge: 1800000,
      },
    });
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
