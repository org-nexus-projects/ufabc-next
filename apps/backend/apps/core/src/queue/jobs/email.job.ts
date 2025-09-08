import type { User } from '@/models/User.js';
import type { QueueContext } from '../types.js';
import {
  SendTemplatedEmailCommand,
  type SendTemplatedEmailCommandInput,
  SendEmailCommand,
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
  subject: string;
  html: string;
  recipients: string[];
  from?: string;
  batchSize?: number;
};

export async function sendBulkEmail(ctx: QueueContext<BulkEmailJob>) {
  const { subject, html, recipients, from, batchSize = 50 } = ctx.job.data;
  
  ctx.app.log.info({ totalRecipients: recipients.length }, 'Iniciando envio de email em massa');
  
  const MAX_RECIPIENTS_PER_MESSAGE = 50;
  const uniqueRecipients = Array.from(new Set(recipients));
  const fromIdentity = from ?? 'contato@ufabcnext.com';
  
  // Função para agrupar destinatários em lotes
  const chunk = <T>(arr: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };
  
  const batches = chunk(uniqueRecipients, Math.min(batchSize, MAX_RECIPIENTS_PER_MESSAGE));
  
  let sentBatches = 0;
  let failedBatches = 0;
  const failures: any[] = [];
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const bcc = batches[batchIndex];
    
    const input = {
      Source: `UFABCnext <${fromIdentity}>`,
      Destination: { BccAddresses: bcc },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } },
      },
    };
    
    try {
      const cmd = new SendEmailCommand(input);
      const res = await sesClient.send(cmd);
      sentBatches++;
      
      ctx.app.log.info({
        batch: batchIndex,
        recipients: bcc.length,
        messageId: res.MessageId,
      }, 'Lote enviado');
      
    } catch (err: any) {
      failedBatches++;
      const failure = { batch: batchIndex, error: err?.message ?? 'unknown', recipients: bcc.length };
      failures.push(failure);
      
      ctx.app.log.error({ 
        batch: batchIndex, 
        error: err?.message,
      }, 'Falha no envio do lote');
    }
  }
  
  const result = {
    totalRecipients: uniqueRecipients.length,
    batches: batches.length,
    sentBatches,
    failedBatches,
    failures,
  };
  
  ctx.app.log.info(result, 'Envio concluído');
  
  return result;
}
