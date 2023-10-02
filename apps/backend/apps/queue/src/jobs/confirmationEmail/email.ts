import { logger } from '@ufabcnext/common';
import { createToken } from '../../helpers/createToken.js';
import { Config } from '../../config/config.js';
import { createQueue, queueProcessor } from '../../setup.js';
import { sesSendEmail } from '../../integration/ses.js';

type UfabcUser = {
  email: string;
  ra: number;
};

async function sendConfirmationEmail(nextUser: UfabcUser) {
  const emailTemplate = Config.EMAIL_CONFIRMATION_TEMPLATE;
  const token = createToken(JSON.stringify({ email: nextUser.email }));
  const emailRequest = {
    recipient: nextUser.email,
    body: {
      url: `${Config.WEB_URL}/confirm?token=${token}`,
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
