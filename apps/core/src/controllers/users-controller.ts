import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { legacyJwtHook } from '@/hooks/legacy-auth.js';
import {
  centralErrorHandler,
  schemaErrorFormatter,
} from '@/plugins/v2/error-handler.js';
import {
  buildUserInfo,
  checkUserEmail,
  completeUser,
  confirmUser,
  deactivateUser,
  loginWithFacebook,
  recoverAccount,
  resendConfirmation,
  validateUserRa,
} from '@/routes/users/service.js';
import { type Auth, completeUserSchema } from '@/schemas/auth.js';
import {
  confirmUserSchema,
  deactivateUserSchema,
  loginFacebookSchema,
  resendEmailSchema,
  sendRecoveryEmailSchema,
  userInfoSchema,
  validateUserEmailSchema,
  validateUserRaSchema,
} from '@/schemas/user.js';

const tags = ['User'];

const usersRoutes: FastifyPluginAsyncZod = async (scoped) => {
  scoped.setErrorHandler(centralErrorHandler);
  scoped.setSchemaErrorFormatter(schemaErrorFormatter);

  const usersCache = scoped.cache<Auth>();

  scoped.route({
    handler: async (request, reply) => {
      const cachedResponse = usersCache.get(`user:info:${request.user._id}`);
      if (cachedResponse) {
        return await reply.status(200).send(cachedResponse);
      }

      const userInfo = await buildUserInfo(request.user._id);

      usersCache.set(`user:info:${request.user._id}`, userInfo);

      return await reply.status(200).send(userInfo);
    },
    method: 'GET',
    onRequest: legacyJwtHook,
    schema: {
      querystring: userInfoSchema.querystring,
      tags,
    },
    url: '/info',
  });

  scoped.route({
    handler: async (request, reply) => {
      const { ra } = request.params as { ra: string };

      return await reply.status(200).send(await validateUserRa(ra));
    },
    method: 'GET',
    schema: {
      params: validateUserRaSchema.params,
      tags,
    },
    url: '/validate/:ra',
  });

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await loginWithFacebook(scoped.jwt, request.body)),
    method: 'POST',
    schema: {
      body: loginFacebookSchema.body,
      response: {
        200: loginFacebookSchema.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/facebook',
  });

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await resendConfirmation(scoped.job, request.user._id)),
    method: 'POST',
    onRequest: legacyJwtHook,
    schema: {
      response: {
        200: resendEmailSchema.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/resend',
  });

  scoped.route({
    handler: async (request, reply) => {
      const completed = await completeUser(
        { job: scoped.job, jwt: scoped.jwt },
        request.user._id,
        request.body,
        request.log,
        request.id
      );

      if (!completed) {
        return completed;
      }

      return await reply.status(200).send(completed);
    },
    method: 'PUT',
    onRequest: legacyJwtHook,
    schema: {
      body: completeUserSchema.body,
      response: {
        200: completeUserSchema.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/complete',
  });

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await confirmUser(
        {
          config: scoped.config,
          jwt: scoped.jwt,
          verifyToken: scoped.verifyToken,
        },
        request.body.token
      )),
    method: 'POST',
    onRequest: legacyJwtHook,
    schema: {
      body: confirmUserSchema.body,
      response: {
        200: confirmUserSchema.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/confirm',
  });

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await deactivateUser(request.user._id)),
    method: 'DELETE',
    onRequest: legacyJwtHook,
    schema: {
      response: {
        200: deactivateUserSchema.response[200].content['application/json']
          .schema,
        404: deactivateUserSchema.response[404].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/remove',
  });

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await checkUserEmail(request.query.ra, request.log, request.id)),
    method: 'GET',
    schema: {
      querystring: validateUserEmailSchema.querystring,
      response: {
        400: validateUserEmailSchema.response[400].content['application/json']
          .schema,
        200: validateUserEmailSchema.response[200].content['application/json']
          .schema,
      },
      tags,
    },
    url: '/check-email',
  });

  scoped.route({
    handler: async (request, reply) =>
      await reply.status(200).send(await recoverAccount(scoped.job, request.body.email)),
    method: 'POST',
    schema: {
      body: sendRecoveryEmailSchema.body,
      tags,
    },
    url: '/recover',
  });
};

export const usersController: FastifyPluginAsyncZod = async (app) => {
  await app.register(usersRoutes, { prefix: '/users' });
};
