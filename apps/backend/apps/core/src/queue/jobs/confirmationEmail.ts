import { logger } from '@next/common';
import { MAILER_CONFIG, WEB_URL, WEB_URL_LOCAL } from '@next/constants';
import { sesSendEmail } from '@/services/ses.js';
import { createQueue } from '../utils/queue.js';
import { createToken } from '../utils/createToken.js';
import type { User } from '@/models/User.js';
import type { Job } from 'bullmq';

async function sendConfirmationEmail(nextUser: Partial<User>) {
  const emailTemplate = MAILER_CONFIG.EMAIL_CONFIRMATION_TEMPLATE;
  const isDev = process.env.NODE_ENV === 'dev';

  const token = createToken(JSON.stringify({ email: nextUser.email }));
  const emailRequest = {
    recipient: nextUser.email!,
    body: {
      url: `${isDev ? WEB_URL_LOCAL : WEB_URL}confirm?token=${token}`,
    },
  };

  try {
    await sesSendEmail(nextUser, emailTemplate, emailRequest);
    return {
      dataId: `Returned value ${nextUser.ra}`,
      data: nextUser,
    };
  } catch (error) {
    logger.error({ error }, 'Error Sending email');
    throw error;
  }
}

export const emailQueue = createQueue('Send:Email');

export const addEmailToConfirmationQueue = async (user: Partial<User>) => {
  await emailQueue.add('Send:Email', user);
};

export const sendEmailWorker = async (job: Job<Partial<User>>) => {
  const user = job.data;

  try {
    await sendConfirmationEmail(user);
  } catch (error) {
    logger.error({ error }, 'sendEmailWorker: Error sending email');
    throw error;
  }
};
