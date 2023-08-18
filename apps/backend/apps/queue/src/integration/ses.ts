import { Config } from '../config/config';
import {
  SESClient,
  SendEmailCommand,
  type SendEmailCommandInput,
} from '@aws-sdk/client-ses';
import { logger } from '@ufabcnext/common';

const sesClient = new SESClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: Config.accessKeyId,
    secretAccessKey: Config.secretAccessKey,
  },
});

async function sesSendEmail() {
  try {
    const sendEmailCommandInput = {
      Destination: {
        CcAddresses: ['joabevarjao123@gmail.com'],
        ToAddresses: ['joabevarjao123@gmail.com'],
      },
      Message: {
        Body: {
          Html: {
            Data: 'Vamos ver kct',
          },
        },
        Subject: {
          Data: 'Testando ses',
        },
      },
      Source: 'joabevarjao123@gmail.com',
      ReplyToAddresses: ['joabevarjao123@gmail.com'],
    } satisfies SendEmailCommandInput;
    const command = new SendEmailCommand(sendEmailCommandInput);
    const data = await sesClient.send(command);
    return data;
  } catch (error) {
    logger.error({ error }, 'Unknown error sending email');
  } finally {
    sesClient.destroy();
  }
}

sesSendEmail();
