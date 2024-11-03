import { fastifyPlugin as fp } from 'fastify-plugin';
import { fastifyOauth2 } from '@fastify/oauth2';
import fastifySession from '@fastify/session';
import fastifyCookie from '@fastify/cookie';
import type { Auth } from '@/schemas/auth.js';

declare module 'fastify' {
  interface Session {
    user: Auth;
  }
}

export default fp(
  async (app) => {
    // app.register(fastifyCookie);
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
      // userAgent: 'UFABC next (2.0.0)',
      scope: ['profile', 'email'],
      credentials: {
        client: {
          id: app.config.OAUTH_GOOGLE_CLIENT_ID,
          secret: app.config.OAUTH_GOOGLE_SECRET,
        },
        auth: fastifyOauth2.GOOGLE_CONFIGURATION,
      },
      startRedirectPath: '/login/google',
      callbackUri: (req) =>
        `${app.config.PROTOCOL}://${req.hostname}:5000/login/google`,
    });

    app.log.info('[PLUGIN] Cookie, Session, Oauth');

    // app.get(`/login/google`, async function (request, reply) {
    //   try {
    //     const validatedURI = await this.google.generateAuthorizationUri(
    //       request,
    //       reply,
    //     );
    //     return reply.redirect(validatedURI);
    //   } catch (error) {
    //     request.log.warn(error);
    //   }
    // });

    app.get(`/login/google/callback`, async function (request, reply) {
      try {
        return {
          name: 'Joabe',
        };
        // await handleOauth.call(this, 'google', request, reply, providers);
      } catch (error: any) {
        if (error?.data?.payload) {
          reply.log.error({ error: error.data.payload }, 'Error in oauth2');
          return error.data.payload;
        }

        // Unknwon (probably db) error
        request.log.warn(error, 'deu merda severa');
        return reply.internalServerError(
          'Algo de errado aconteceu no seu login, tente novamente',
        );
      }
    });
  },
  { name: 'oauth2' },
);
