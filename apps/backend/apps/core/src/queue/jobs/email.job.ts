import type { User } from '@/models/User.js';
import type { QueueContext } from '../types.js';
import {
  SendTemplatedEmailCommand,
  type SendTemplatedEmailCommandInput,
} from '@aws-sdk/client-ses';
import { sesClient } from '@/lib/aws.service.js';

const MAILER_CONFIG = {
  EMAIL_CONFIRMATION_TEMPLATE: 'Confirmation',
  EMAIL_RECOVERY_TEMPLATE: 'Recovery',
  EMAIL: 'contato@ufabcnext.com',
} as const;

type Email = {
  recipient: string;
  body: {
    url: string;
    recovery_facebook?: string;
    recovery_google?: string;
  };
};

export async function sendConfirmationEmail(ctx: QueueContext<User>) {
  const emailTemplate = MAILER_CONFIG.EMAIL_CONFIRMATION_TEMPLATE;
  const { data } = ctx.job;
  if (!data.email) {
    throw new Error('Email not found');
  }

  try {
    const token = ctx.app.createToken(
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
    ctx.app.log.warn({
      sentTo: `Returned value ${data.ra}`,
      messageId: response?.MessageId,
    });
  } catch (error) {
    ctx.app.log.error({ error }, 'Error Sending email');
    throw error;
  }
}

export async function sesSendEmail(
  user: User,
  templateId: 'Confirmation' | 'Recover',
  email: Email,
) {
  let templateData: string;
  if (templateId === 'Confirmation') {
    templateData = JSON.stringify({ url: email.body.url });
  } else {
    templateData = JSON.stringify({
      recovery_facebook: email.body.recovery_facebook,
      recovery_google: email.body.recovery_google,
    });
  }

  try {
    if (!user.email) {
      throw new Error('Email not found, the email must be provided');
    }

    const sendTemplatedEmailCommand = {
      Source: 'UFABC next <contato@ufabcnext.com>',
      Destination: {
        ToAddresses: [user.email],
      },
      TemplateData: templateData,
      Template: templateId,
    } satisfies SendTemplatedEmailCommandInput;
    const command = new SendTemplatedEmailCommand(sendTemplatedEmailCommand);
    const data = await sesClient.send(command);
    return data;
  } finally {
    sesClient.destroy();
  }
}
