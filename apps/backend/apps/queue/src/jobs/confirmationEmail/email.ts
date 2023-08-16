import { createToken } from '../../helpers/createToken';
import { sendEmail } from '../../integration/sendgrid';
import { createQueue, queueProcessor } from '../../setup';

type UfabcUser = {
  email: string;
  ra: number;
};

async function sendConfirmationEmail(nextUser: UfabcUser) {
  console.log({ email: nextUser.email, ra: nextUser.ra }, 'sendConfirmation');
  const token = createToken(JSON.stringify({ email: nextUser.email }));
  const emailRequest = {
    recipient: nextUser.email,
    body: {
      url: `http://localhost:7500/confirm?token=${token}`,
    },
  };

  const emailTemplate = Config.EMAIL_TEMPLATE_ID;
  try {
    await sendEmail(emailRequest, {}, emailTemplate);
    return {
      jobId: `Returned value ${nextUser.id}`,
      job: nextUser,
    };
  } catch (error) {
    console.error('worker error', error);
    throw error;
  }
}

const sendEmail;

export const sendEmailJob = async (user: UfabcUser) => {
  const emailQueue = createQueue('Send:Email');
  const { job } = await sendConfirmationEmail(user);
  console.log('jobs', job);
  await queueProcessor(emailQueue.name, job);
  await emailQueue.add('Send:Email', user);
};
