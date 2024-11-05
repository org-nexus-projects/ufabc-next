import { authenticate } from '@/hooks/authenticate.js';
import { AccountHandler } from './account.handlers.js';
import {
  completeUserSchema,
  confirmUserSchema,
  disableUserAccountSchema,
  loginFacebookSchema,
  removeUserDeviceSchema,
  resendEmailSchema,
  setUserDeviceSchema,
  usersInfoSchema,
} from './account.schema.js';
import type { FastifyInstance } from 'fastify';

export async function accountRoutes(app: FastifyInstance) {
  const nextAccountHandler = new AccountHandler();

  app.post(
    '/confirm',
    { schema: confirmUserSchema },
    nextAccountHandler.confirmNextUser,
  );
  app.put<{ Body: { email: string; ra: number } }>(
    '/complete',
    { schema: completeUserSchema, onRequest: [authenticate] },
    nextAccountHandler.completeNextUser,
  );
  app.post(
    '/resend',
    { schema: resendEmailSchema, onRequest: [authenticate] },
    nextAccountHandler.resendNextEmail,
  );

  app.get(
    '/facebook',
    { schema: loginFacebookSchema },
    nextAccountHandler.loginFacebook,
  );
}
