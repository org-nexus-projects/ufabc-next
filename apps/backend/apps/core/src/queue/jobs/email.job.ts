import type { User } from '@/models/User.js';
import type { QueueContext } from '../types.js';
import {
  SendTemplatedEmailCommand,
  type SendTemplatedEmailCommandInput,
} from '@aws-sdk/client-ses';
import { sesClient } from '@/lib/aws.service.js';

const MAILER_CONFIG = {
  EMAIL_CONFIRMATION_TEMPLATE: 'Confirmation',
  EMAIL_RECOVERY_TEMPLATE: 'Recover',
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

type EmailJobData = {
  user: User;
  kind: 'Confirmation' | 'Recover';
};

export async function sendConfirmationEmail(ctx: QueueContext<EmailJobData>) {
  const { user, kind } = ctx.job.data;
  const emailTemplate =
    kind === 'Confirmation'
      ? MAILER_CONFIG.EMAIL_CONFIRMATION_TEMPLATE
      : MAILER_CONFIG.EMAIL_RECOVERY_TEMPLATE;

  if (!user.email) {
    throw new Error('Email not found');
  }
  ctx.app.log.info({ msg: 'eai pai', user });
  try {
    const token = ctx.app.createToken(
      JSON.stringify({ email: user.email }),
      ctx.app.config,
    );
    const emailRequest = {
      recipient: user.email,
      body: {
        url: `${ctx.app.config.WEB_URL}/confirm?token=${token}`,
      },
    };
    const response = await sesSendEmail(user, emailTemplate, emailRequest);
    ctx.app.log.warn({
      sentTo: `Returned value ${user.ra}:${user.email}`,

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
