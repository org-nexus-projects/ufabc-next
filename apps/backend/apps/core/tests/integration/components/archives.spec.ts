import { startTestStack } from '@next/testing/containers';
import { waitForJobCompletion } from '@next/testing/methods';
import { moodleMock } from '@next/testing/mocks';
import { fastify, type FastifyInstance } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { buildApp } from '../../../src/app.js';
import { JOB_NAMES } from '../../constants.js';

describe('Archive Flow Integration', () => {
  let stack: Awaited<ReturnType<typeof startTestStack>>;
  let app: FastifyInstance;

  beforeAll(async () => {
    stack = await startTestStack();
    app = fastify({ logger: true });
    await app.register(fp(buildApp), {
      config: { ...stack.config, NODE_ENV: 'test' },
    });
    await app.ready();
  });

  afterAll(async () => {
    moodleMock.cleanup();
    await app.close();
    await stack.stop();
  });

  it('should process moodle components and persist to S3', async () => {
    const componentName = 'Full-Stack-Architecture-101';

    moodleMock.setupArchiveFlow(101, componentName);

    const res = await app.inject({
      method: 'POST',
      url: '/v2/components/archives',
      headers: { 'session-id': 'mock-id', 'sess-key': 'mock-key' },
    });
    expect(res.statusCode).toBe(202);

    const summaryQueue = app.manager.getQueue(
      JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_SUMMARY
    );
    await waitForJobCompletion(summaryQueue);

    const pdfsRes = await app.inject({
      method: 'GET',
      url: '/v2/components/archives/pdfs',
    });
    const pdfs = JSON.parse(pdfsRes.body);

    expect(pdfs.length).toBeGreaterThan(1);
  });
});
