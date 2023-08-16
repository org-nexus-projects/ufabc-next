import { ofetch, FetchError } from 'ofetch';

type Email = {
  recipient: string;
  body: { url: string };
};

type Sender = {
  name: string;
  email: string;
};

export async function sendEmail(
  // eslint-disable-next-line
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
    Authorization: `Bearer ${Config.SENDGRID_TOKEN}`,
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
    const response = await ofetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers,
    });
    console.log('sendgrid', response);
    return response;
  } catch (error) {
    if (error instanceof FetchError) {
      console.error(
        { reason: error.name, issues: error.message },
        'Error while requesting sendGrid',
      );
      throw error.data;
    }
    console.error({ error }, 'Unknown Request error');
    throw error;
  }
}
