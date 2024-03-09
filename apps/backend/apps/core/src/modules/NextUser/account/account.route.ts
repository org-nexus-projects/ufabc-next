import { UserModel } from '@/models/User.js';
import { authenticate } from '@/hooks/authenticate.js';
import { AccountHandler } from './account.handlers.js';
import { AccountService } from './account.service.js';
import { AccountRepository } from './account.repository.js';
import type { FastifyInstance } from 'fastify';

export async function accountRoutes(app: FastifyInstance) {
  const nextAccountRepository = new AccountRepository(UserModel);
  const nextAccountService = new AccountService(nextAccountRepository);
  const nextAccountHandler = new AccountHandler(nextAccountService);

  app.decorate('accountService', nextAccountService);

  app.post('/confirm', nextAccountHandler.confirmNextUser);
  app.put<{ Body: { email: string; ra: number } }>(
    '/complete',
    { onRequest: [authenticate] },
    nextAccountHandler.completeNextUser,
  );
  app.post(
    '/resend',
    { onRequest: [authenticate] },
    nextAccountHandler.resendNextEmail,
  );
  app.get(
    '/info',
    { onRequest: [authenticate] },
    nextAccountHandler.nextUserInfo,
  );
}
