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
  RECOVERY_URL: 'https://api.v2.ufabcnext.com/login',
} as const;

type Email = {
  recipient: string;
  body: {
    url?: string;
    recovery_facebook?: string;
    recovery_google?: string;
  };
};

type EmailJobData = {
  user: User & { _id: string };
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

  try {
    let emailRequest: Email;

    if (kind === 'Confirmation') {
      const token = ctx.app.createToken(
        JSON.stringify({ email: user.email }),
        ctx.app.config,
      );
      emailRequest = {
        recipient: user.email,
        body: {
          url: `${ctx.app.config.WEB_URL}/confirm?token=${token}`,
        },
      };
    } else {
      // Recovery email
      emailRequest = {
        recipient: user.email,
        body: {
          recovery_facebook: 'https://api.v2.ufabcnext.com/users/facebook',
          recovery_google: `${MAILER_CONFIG.RECOVERY_URL}/google?userId=${user._id}`,
        },
      };
    }

    const response = await sesSendEmail(
      user,
      emailTemplate,
      emailRequest,
      ctx.app.log,
    );
    ctx.app.log.info({
      sentTo: `${user.email}`,
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
  log: any,
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
  } catch (error) {
    log.error(error, {
      msg: 'error calling ses',
    });
    throw error;
  } finally {
    sesClient.destroy();
  }
}

type BulkEmailJob = {
  templateName: string;
  recipients: string[];
};

export async function sendBulkEmail(ctx: QueueContext<BulkEmailJob>) {
  const { templateName, recipients } = ctx.job.data;
  const uniqueRecipients = Array.from(new Set(recipients));
  const fromIdentity = 'contato@ufabcnext.com';
  
  let sentEmails = 0;
  let failedEmails = 0;
  const failures: any[] = [];
  
  for (let i = 0; i < uniqueRecipients.length; i++) {
    const recipient = uniqueRecipients[i];
    
    const input = {
      Source: `UFABCnext <${fromIdentity}>`,
      Destination: { 
        ToAddresses: [recipient]
      },
      Template: templateName,
      TemplateData: JSON.stringify({}),
    };
    
    try {
      const cmd = new SendTemplatedEmailCommand(input);
      await sesClient.send(cmd);
      sentEmails++;
    } catch (err: any) {
      failedEmails++;
      const failure = { 
        recipient, 
        error: err?.message ?? 'unknown', 
        i 
      };
      failures.push(failure);
      
      ctx.app.log.error({ 
        recipient, 
        error: err?.message,
        progress: `${i + 1}/${uniqueRecipients.length}`,
      }, 'Failed to send email');
    }
  }
  
  const result = {
    totalRecipients: uniqueRecipients.length,
    sentEmails,
    failedEmails,
    failures,
  };
  
  ctx.app.log.info(result, 'Sending emails completed');
  
  return result;
}
