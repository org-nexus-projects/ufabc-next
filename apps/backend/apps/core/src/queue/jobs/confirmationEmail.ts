import { logger } from '@next/common';
import { MAILER_CONFIG, WEB_URL, WEB_URL_LOCAL } from '@next/constants';
import { sesSendEmail } from '@/services/ses.js';
import { createQueue } from '../utils/queue.js';
import { createToken } from '../utils/createToken.js';
import type { Job } from 'bullmq';

type UfabcUser = {
  email: string;
  ra: number;
};

async function sendConfirmationEmail(nextUser: UfabcUser) {
  const emailTemplate = MAILER_CONFIG.EMAIL_CONFIRMATION_TEMPLATE;
  const isDev = process.env.NODE_ENV === 'dev';

  const token = createToken(JSON.stringify({ email: nextUser.email }));
  const emailRequest = {
    recipient: nextUser.email,
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

export const addEmailToConfirmationQueue = async (user: UfabcUser) => {
  await emailQueue.add('Send:Email', user);
};

export const sendEmailWorker = async (job: Job<UfabcUser>) => {
  const user = job.data;

  try {
    const result = await sendConfirmationEmail(user);
    logger.info({
      msg: 'Email sent to',
      email: result.data.email,
      ra: result.data.ra,
    });
  } catch (error) {
    logger.error({ error }, 'sendEmailWorker: Error sending email');
    throw error;
  }
};
