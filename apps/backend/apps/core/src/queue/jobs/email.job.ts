import { sesSendEmail } from '@/services/ses.js';
import { Config } from '@/config/config.js';
import type { User } from '@/models/User.js';
import type { QueueContext } from '../types.js';

type Result = {
  sentTo: string;
  messageId?: string;
};

export async function sendConfirmationEmail(
  ctx: QueueContext<User>,
): Promise<Result> {
  const emailTemplate = Config.MAILER_CONFIG.EMAIL_CONFIRMATION_TEMPLATE;
  const { data } = ctx.job;
  if (!data.email) {
    throw new Error('Email not found');
  }

  try {
    const token = await ctx.app.createToken(
      JSON.stringify({ email: data.email }),
      ctx.app.config,
    );
    const emailRequest = {
      recipient: data?.email,
      body: {
        url: `${ctx.app.config.WEB_URL}/confirm?token=${token}`,
      },
    };
    const response = await sesSendEmail(data, emailTemplate, emailRequest);
    return {
      sentTo: `Returned value ${data.ra}`,
      messageId: response?.MessageId,
    };
  } catch (error) {
    ctx.app.log.error({ error }, 'Error Sending email');
    throw error;
  }
}
