import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import { completeUserSchema, type Auth } from '@/schemas/auth.js';
import {
  confirmUserSchema,
  deactivateUserSchema,
  loginFacebookSchema,
  resendEmailSchema,
  sendRecoveryEmailSchema,
  validateUserEmailSchema,
} from '@/schemas/user.js';

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
} from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  const usersCache = app.cache<Auth>();
  app.get('/info', async (request) => {
    const cachedResponse = usersCache.get(`user:info:${request.user._id}`);
    if (cachedResponse) {
      return cachedResponse;
    }

    const userInfo = await buildUserInfo(request.user._id);

    usersCache.set(`user:info:${request.user._id}`, userInfo);

    return userInfo;
  });
  app.get('/validate/:ra', async (request) => {
    const { ra } = request.params as { ra: string };

    return await validateUserRa(ra);
  });

  app.post('/facebook', { schema: loginFacebookSchema }, async (request) =>
    loginWithFacebook(app.jwt, request.body)
  );

  app.post('/resend', { schema: resendEmailSchema }, async (request) =>
    resendConfirmation(app.job, request.user._id)
  );

  app.put('/complete', { schema: completeUserSchema }, async (request) =>
    completeUser(
      { job: app.job, jwt: app.jwt },
      request.user._id,
      request.body,
      request.log,
      request.id
    )
  );

  app.post('/confirm', { schema: confirmUserSchema }, async (request) =>
    confirmUser(
      { config: app.config, jwt: app.jwt, verifyToken: app.verifyToken },
      request.body.token
    )
  );

  app.delete('/remove', { schema: deactivateUserSchema }, async ({ user }) =>
    deactivateUser(user._id)
  );

  app.get(
    '/check-email',
    { schema: validateUserEmailSchema },
    async (request) => checkUserEmail(request.query.ra, request.log, request.id)
  );

  app.post(
    '/recover',
    { schema: sendRecoveryEmailSchema },
    async (request) => recoverAccount(app.job, request.body.email)
  );
};

export default plugin;
