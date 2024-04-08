import { logger } from '@next/common';
import { sesSendEmail } from '@/services/ses.js';
import { Config } from '@/config/config.js';
import { createToken } from '../utils/createToken.js';
import type { User } from '@/models/User.js';

type NextUser = Pick<User, 'email' | 'ra'>;

export async function sendConfirmationEmail(data: NextUser) {
  const emailTemplate = Config.MAILER_CONFIG.EMAIL_CONFIRMATION_TEMPLATE;
  const isDev = Config.NODE_ENV === 'dev';

  if (!data.email) {
    throw new Error('Email not found');
  }

  const token = createToken(JSON.stringify({ email: data.email }));
  const emailRequest = {
    recipient: data?.email,
    body: {
      url: `${
        isDev ? Config.WEB_URL_LOCAL : Config.WEB_URL
      }confirm?token=${token}`,
    },
  };

  try {
    await sesSendEmail(data, emailTemplate, emailRequest);
    return {
      dataId: `Returned value ${data.ra}`,
      data,
    };
  } catch (error) {
    logger.error({ error }, 'Error Sending email');
    throw error;
  }
}
