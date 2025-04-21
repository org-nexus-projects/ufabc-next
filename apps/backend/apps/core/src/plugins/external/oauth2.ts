import { fastifyPlugin as fp } from 'fastify-plugin';
import { fastifyOauth2, type OAuth2Namespace } from '@fastify/oauth2';
import type { Auth } from '@/schemas/auth.js';

declare module 'fastify' {
  interface FastifyInstance {
    google: OAuth2Namespace;
    notion: OAuth2Namespace;
  }
  interface Session {
    user: Auth;
  }
}

const NOTION_CONFIGURATION = {
  authorizeHost: 'https://api.notion.com',
  authorizePath: '/v1/oauth/authorize',
  tokenHost: 'https://api.notion.com',
  tokenPath: '/v1/oauth/token',
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
        return request.query.userId;
      },
      checkStateFunction: () => true,
    });

    await app.register(fastifyOauth2, {
      name: 'notion',
      userAgent: 'UFABC next (2.0.0)',
      credentials: {
        client: {
          id: app.config.OAUTH_NOTION_CLIENT_ID,
          secret: app.config.OAUTH_NOTION_SECRET,
        },
        auth: NOTION_CONFIGURATION,
      },
      // Notion requires these scopes
      scope: ['basic'],
      callbackUri: (req) =>
        `${app.config.PROTOCOL}://${req.host}/login/notion/callback`,
      checkStateFunction: () => true,
    });

    app.log.info('[PLUGIN] Oauth');
  },
  { name: 'oauth2' },
);
