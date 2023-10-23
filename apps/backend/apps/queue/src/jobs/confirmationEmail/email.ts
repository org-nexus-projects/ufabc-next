import { logger } from '@ufabcnext/common';
import { MAILER_CONFIG, WEB_URL, WEB_URL_LOCAL } from '@next/constants';
import { createToken } from '../../helpers/create-token.js';
import { Config } from '../../config/config.js';
import { createQueue, queueProcessor } from '../../setup.js';
import { sesSendEmail } from '../../integration/ses.js';

type UfabcUser = {
  email: string;
  ra: number;
};

async function sendConfirmationEmail(nextUser: UfabcUser) {
  const emailTemplate = MAILER_CONFIG.EMAIL_CONFIRMATION_TEMPLATE;
  const isDev = Config.NODE_ENV === 'dev';
  const token = createToken(JSON.stringify({ email: nextUser.email }));
  const emailRequest = {
    recipient: nextUser.email,
    body: {
      url: `${isDev ? WEB_URL_LOCAL : WEB_URL}/confirm?token=${token}`,
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

export const sendEmailJob = async (user: UfabcUser) => {
  const emailQueue = createQueue('Send:Email');
  await sendConfirmationEmail(user);
  await queueProcessor(emailQueue.name);
  await emailQueue.add('Send:Email', user);
};
