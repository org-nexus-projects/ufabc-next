import { ofetch, FetchError } from 'ofetch';
import { logger } from '@ufabcnext/common';
import { Config } from '../config/config.js';

type Email = {
  recipient: string;
  body: { url: string };
};

type Sender = {
  name: string;
  email: string;
};

export async function sendEmail(
  emails: Email[] | Email,
  sender: Partial<Sender> = {},
  templateId: string,
) {
  const emailList = Array.isArray(emails) ? emails : [emails];

  const personalizations = emailList.map((email) => ({
    to: [{ email: email.recipient }],
    dynamic_template_data: email.body || {},
  }));
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${Config.MAILER_ID}`,
  };

  const payload = {
    personalizations,
    from: {
      email: 'contato@ufabcnext.com',
      name: sender.name || 'UFABC next',
    },
    reply_to: {
      email: sender.email || 'contato@ufabcnext.com',
      name: sender.name || 'UFABC next',
    },
    template_id: templateId,
  };

  try {
    await ofetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers,
    });
  } catch (error) {
    if (error instanceof FetchError) {
      logger.error(
        { reason: error.name, issues: error.message },
        'Error while requesting sendGrid',
      );
      throw error.data;
    }
    logger.error({ error }, 'Unknown Request error');
    throw error;
  }
}
