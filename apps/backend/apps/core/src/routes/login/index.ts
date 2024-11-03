import { loginSchema } from '@/schemas/login.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

export const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/googles', async function (request, reply) {
    const validatedURI = await this.google.generateAuthorizationUri(
      request,
      reply,
    );
    const redirectURL = new URL(validatedURI);
    app.log.warn(
      {
        url: redirectURL.hostname,
        query: redirectURL.search.split('&'),
        port: request.hostname,
      },
      '[OAUTH] start',
    );
    return reply.redirect(validatedURI);
  });

  app.get(
    '/googles/callback',
    { schema: loginSchema },
    async function (request, reply) {
      try {
        request.log.info('vem aqui?');
        const { userId, inApp } = request.query;
        const { token } =
          await this.google.getAccessTokenFromAuthorizationCodeFlow(
            request,
            reply,
          );
        return reply.send(token);
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
    },
  );
};

export default plugin;
