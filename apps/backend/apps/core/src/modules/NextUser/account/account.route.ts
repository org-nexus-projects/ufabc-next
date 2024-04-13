import { UserModel } from '@/models/User.js';
import { authenticate } from '@/hooks/authenticate.js';
import { AccountHandler } from './account.handlers.js';
import { AccountService } from './account.service.js';
import { AccountRepository } from './account.repository.js';
import {
  completeUserSchema,
  confirmUserSchema,
  resendEmailSchema,
  usersInfoSchema,
} from './account.schema.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function accountRoutes(app: FastifyInstance) {
  const nextAccountRepository = new AccountRepository(UserModel);
  const nextAccountService = new AccountService(nextAccountRepository);
  const nextAccountHandler = new AccountHandler(nextAccountService);

  app.decorate('accountService', nextAccountService);

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
    '/info',
    { schema: usersInfoSchema, onRequest: [authenticate] },
    nextAccountHandler.nextUserInfo,
  );

  app.delete(
    '/remove',
    { onRequest: [authenticate] },
    nextAccountHandler.disableUserAccount,
  );

  app.post<{
    Body: {
      deviceId: string;
      token: string;
    };
  }>(
    '/devices',
    { onRequest: [authenticate] },
    nextAccountHandler.setUserDevice,
  );
  app.delete<{ Params: { deviceId: string } }>(
    '/devices/:deviceId',
    { onRequest: [authenticate] },
    nextAccountHandler.removeUserDevice,
  );
}
