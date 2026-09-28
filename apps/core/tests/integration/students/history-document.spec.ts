import { startTestStack, type TestStack } from '@next/testing/containers';
import { ufabcParserMock } from '@next/testing/mocks';
import { fastify, type FastifyInstance } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { buildApp } from '../../../src/app.js';

function buildMultipartBody(filename: string, content: string) {
  const boundary = '----history-document-test-boundary';
  const body = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    'Content-Type: application/pdf',
    '',
    content,
    `--${boundary}--`,
    '',
  ].join('\r\n');

  return {
    body,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

describe('Student History Document Upload', () => {
  let stack: TestStack;
  let app: FastifyInstance;

  beforeAll(async () => {
    stack = await startTestStack();
    app = fastify();

    await app.register(fp(buildApp), {
      config: { ...stack.config, NODE_ENV: 'test' },
    });

    await app.manager.start();
    await app.ready();
  });

  afterEach(() => {
    ufabcParserMock.cleanup();
  });

  afterAll(async () => {
    await app.close();
    await stack.stop();
  });

  async function getToken() {
    const res = await app.inject({ method: 'POST', url: '/_test/token' });
    return JSON.parse(res.body).token;
  }

  it('rejects unauthenticated uploads', async () => {
    const { body, contentType } = buildMultipartBody(
      'historico.pdf',
      'PDF_BYTES'
    );

    const res = await app.inject({
      method: 'POST',
      url: '/v2/students/history-document',
      headers: { 'content-type': contentType },
      payload: body,
    });

    expect(res.statusCode).toBe(401);
  });

  it('uploads the file to ufabc-parser and returns the studentKey', async () => {
    const token = await getToken();
    const scope = ufabcParserMock.syncStudent('test@example.com', {
      createdAt: new Date().toISOString(),
      studentKey: 'student-key-123',
      studentHistoryKey: 'history-key-123',
      result: {},
    });

    const { body, contentType } = buildMultipartBody(
      'historico.pdf',
      'PDF_BYTES'
    );

    const res = await app.inject({
      method: 'POST',
      url: '/v2/students/history-document',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': contentType,
      },
      payload: body,
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      status: 'success',
      studentKey: 'student-key-123',
    });
    expect(scope.isDone()).toBe(true);
  });

  it('returns 503 when ufabc-parser rejects the requester key', async () => {
    const token = await getToken();
    ufabcParserMock.syncStudentFailure('test@example.com', 401, {
      code: 'UFP0001',
    });

    const { body, contentType } = buildMultipartBody(
      'historico.pdf',
      'PDF_BYTES'
    );

    const res = await app.inject({
      method: 'POST',
      url: '/v2/students/history-document',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': contentType,
      },
      payload: body,
    });

    expect(res.statusCode).toBe(503);
  });

  it('returns 400 when no file is sent', async () => {
    const token = await getToken();

    const res = await app.inject({
      method: 'POST',
      url: '/v2/students/history-document',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when ufabc-parser rejects a malformed PDF', async () => {
    const token = await getToken();
    ufabcParserMock.syncStudentFailure('test@example.com', 400, {
      code: 'UFP0002',
    });

    const { body, contentType } = buildMultipartBody(
      'historico.pdf',
      'NOT_A_REAL_PDF'
    );

    const res = await app.inject({
      method: 'POST',
      url: '/v2/students/history-document',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': contentType,
      },
      payload: body,
    });

    expect(res.statusCode).toBe(400);
  });

  it('rejects files larger than the configured limit', async () => {
    const token = await getToken();
    const { body, contentType } = buildMultipartBody(
      'historico.pdf',
      'A'.repeat(11 * 1024 * 1024)
    );

    const res = await app.inject({
      method: 'POST',
      url: '/v2/students/history-document',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': contentType,
      },
      payload: body,
    });

    expect(res.statusCode).toBe(413);
  });
});
