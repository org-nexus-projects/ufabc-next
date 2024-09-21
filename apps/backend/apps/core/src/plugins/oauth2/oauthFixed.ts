import { fastifyPlugin as fp } from 'fastify-plugin';
import { fastifyOauth2, type OAuth2Namespace } from '@fastify/oauth2';
import type { FastifyInstance } from 'fastify';
import { Config } from '@/config/config.js';

async function oauth2Debug(app: FastifyInstance, opts: Record<string, string>) {
  await app.register(fastifyOauth2, {
    name: 'google',
    credentials: {
      client: {
        id: opts.OAUTH_GOOGLE_CLIENT_ID,
        secret: opts.OAUTH_GOOGLE_SECRET,
      },
      auth: fastifyOauth2.GOOGLE_CONFIGURATION,
    },
    scope: ['profile', 'email'],
    callbackUri: (req) =>
      `${Config.PROTOCOL}://${req.hostname}/login/google/callback`,
  });

  app.get('/login/google', {}, async function (request, reply) {
    try {
      console.log('do nosso lado - request', request.query.state);
      app.log.warn({
        URLState: request.query.state,
        googleStateCookie: request.cookies['oauth2-redirect-state'],
        cookies: request.cookies,
      });
      const oauthRedirectURI = await this.google.generateAuthorizationUri(
        request,
        reply,
      );
      request.log.warn(oauthRedirectURI, 'redirecting to');
      return reply.redirect(oauthRedirectURI);
    } catch (error) {
      request.log.warn(error);
    }
  });

  app.get('/login/google/callback', async function (request, reply) {
    try {
      console.log('do nosso lado - callback', request.query.state);
      app.log.warn({
        URLState: request.query.state,
        googleStateCookie: request.cookies['oauth2-redirect-state'],
        cookies: request.cookies,
      });
      const { token } =
        await this.google.getAccessTokenFromAuthorizationCodeFlow(request);
      return token.access_token;
    } catch (error) {
      if (error?.data?.payload) {
        reply.log.error({ error: error.data.payload }, 'Error in oauth2');
        return error.data.payload;
      }

      reply.log.warn(error, 'error');
      return reply.status(500).send(error, {
        msg: 'deu pau',
      });
    }
  });
}

export default fp(oauth2Debug, { name: 'NextOauth2' });

declare module 'fastify' {
  export interface FastifyInstance {
    google: OAuth2Namespace;
  }
}
