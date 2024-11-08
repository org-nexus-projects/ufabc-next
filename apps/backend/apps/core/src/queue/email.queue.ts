import { sesSendEmail } from '@/services/ses.js';
import type { Job } from 'bullmq';
import type { FastifyInstance } from 'fastify';

type EmailPayload = {
  user: { email: string; ra: number };
  templateId: 'Confirmation' | 'Recover';
  email: {
    recipient: string;
    body: {
      url: string;
      recovery_facebook?: string;
      recovery_google?: string;
    };
  };
};

export const EMAIL_QUEUE = 'send:email';

export async function emailProcessor({
  app,
  job,
}: { app?: FastifyInstance; job: Job<EmailPayload> }) {
  const { email, templateId, user } = job.data;

  if (!user.email) {
    throw new Error('Missing email');
  }

  const token = await app?.hash(JSON.stringify({ email: user.email }));
  const emailRequest = {
    recipient: user.email,
    body: {
      url: `${app?.config.WEB_URL}/confirm?token=${token}`,
    },
  };
  await sesSendEmail(user, templateId, emailRequest);
}
