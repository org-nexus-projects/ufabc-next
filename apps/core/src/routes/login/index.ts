import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import { googleCallbackSchema } from '@/schemas/login.js';

import {
  buildGoogleAuthorizationUrl,
  completeGoogleLogin,
} from './service.js';

export const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/google', async function (request, reply) {
    const redirectURL = await buildGoogleAuthorizationUrl(
      this.google,
      request,
      reply,
      app.log
    );

    return reply.redirect(redirectURL);
  });

  app.get(
    '/google/callback',
    { schema: googleCallbackSchema },
    async function (request, reply) {
      return await completeGoogleLogin(
        { config: app.config, google: this.google, jwt: this.jwt },
        request,
        reply
      );
    }
  );
};

export default plugin;
