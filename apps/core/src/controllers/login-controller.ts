import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import {
  centralErrorHandler,
  schemaErrorFormatter,
} from '@/plugins/v2/error-handler.js';
import {
  buildGoogleAuthorizationUrl,
  completeGoogleLogin,
} from '@/routes/login/service.js';
import {
  googleCallbackSchema,
  startGoogleLoginSchema,
} from '@/schemas/login.js';

const tags = ['Login'];

const loginRoutes: FastifyPluginAsyncZod = async (scoped) => {
  scoped.setErrorHandler(centralErrorHandler);
  scoped.setSchemaErrorFormatter(schemaErrorFormatter);

  scoped.route({
    handler: async (request, reply) => {
      const redirectURL = await buildGoogleAuthorizationUrl(
        scoped.google,
        request,
        reply,
        request.log
      );

      return reply.redirect(redirectURL);
    },
    method: 'GET',
    schema: {
      querystring: startGoogleLoginSchema.querystring,
      tags,
    },
    url: '/google',
  });

  scoped.route({
    handler: async (request, reply) =>
      completeGoogleLogin(
        { config: scoped.config, google: scoped.google, jwt: scoped.jwt },
        request,
        reply
      ),
    method: 'GET',
    schema: {
      querystring: googleCallbackSchema.querystring,
      tags,
    },
    url: '/google/callback',
  });
};

export const loginController: FastifyPluginAsyncZod = async (app) => {
  await app.register(loginRoutes, { prefix: '/login' });
};
