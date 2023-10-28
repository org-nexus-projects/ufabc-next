import {
  SESClient,
  SendTemplatedEmailCommand,
  type SendTemplatedEmailCommandInput,
} from '@aws-sdk/client-ses';
import { logger } from '@next/common';
import { Config } from '../config/config.js';

type Email = {
  recipient: string;
  body: {
    url: string;
    recovery_facebook?: string;
    recovery_google?: string;
  };
};

type UfabcUser = {
  email: string;
  ra: number;
};

export async function sesSendEmail(
  user: UfabcUser,
  templateId: 'Confirmation' | 'Recover',
  email: Email,
) {
  const sesClient = new SESClient({
    region: Config.AWS_REGION,
    credentials: {
      accessKeyId: Config.AWS_ACCESS_KEY_ID,
      secretAccessKey: Config.AWS_SECRET_ACCESS_KEY,
    },
  });
  let templateData;
  if (templateId === 'Confirmation') {
    templateData = JSON.stringify({ url: email.body.url });
  } else {
    templateData = JSON.stringify({
      recovery_facebook: email.body.recovery_facebook,
      recovery_google: email.body.recovery_google,
    });
  }

  try {
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
    logger.error({ error }, 'Unknown error sending email');
  } finally {
    sesClient.destroy();
  }
}
