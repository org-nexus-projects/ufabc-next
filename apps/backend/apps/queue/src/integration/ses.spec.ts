import assert from 'node:assert';
import { MAILER_CONFIG } from '@next/constants';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { sesSendEmail } from './ses.js';

// TODO: write tests for the email send
describe('integration.ses', () => {
  let stub: any;
  vi.mock('aws-sdk/client-ses', () => ({
    SESClient: vi.fn(() => ({
      send: vi.fn().mockResolvedValue({}),
      destroy: vi.fn(),
    })),
    SendTemplatedEmailCommand: vi.fn(),
  }));

  vi.mock('@/config/config.js', () => ({
    Config: {
      AWS_REGION: 'your-region',
      AWS_ACCESS_KEY_ID: 'your-access-key-id',
      AWS_SECRET_ACCESS_KEY: 'your-secret-access-key',
    },
  }));

  beforeEach(() => {
    // stub = sinon.stub(ofetch, 'post');
  });

  afterEach(() => {
    vi.clearAllMocks();
    // stub.restore();
  });

  it.skip('send a email to a single recipient', async () => {
    const email = {
      recipient: 'email@test.com',
      body: {
        name: 'My name',
      },
    };

    const sender = { name: 'test', email: 'sender@email.com' };

    await sesSendEmail(email, sender, 'templateId');
    assert.equal(stub.callCount, 1);
    assert.equal(
      stub.firstCall.args[0],
      'https://api.sendgrid.com/v3/mail/send',
    );
    const params = stub.firstCall.args[1];
    assert.equal(params.personalizations.length, 1);
    assert.equal(params.from.name, sender.name);
    assert.equal(params.from.email, MAILER_CONFIG.EMAIL);
    assert.equal(params.reply_to.email, sender.email);
  });

  it.skip('send a email for multiple single recipient', async () => {
    const email = [
      {
        recipient: 'email@test.com',
        body: { name: 'My name' },
      },
      {
        recipient: 'email2@test.com',
      },
    ];

    await sesSendEmail(email, {}, 'templateId');
    assert.deepEqual(stub.callCount, 1);
    assert.deepEqual(
      stub.firstCall.args[0],
      'https://api.sendgrid.com/v3/mail/send',
    );
    const params = stub.firstCall.args[1];
    assert.deepEqual(params.personalizations.length, 2);
  });
});
