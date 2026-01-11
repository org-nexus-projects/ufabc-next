import { startTestStack, type TestStack } from '@next/testing/containers';
import { fastify, type FastifyInstance } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { buildApp } from '../../src/app.js';

describe('Bull Board Security (Blackbox)', () => {
  let stack: TestStack;
  let app: FastifyInstance;
  const BOARD_PATH = '/v2/board/ui/';

  beforeAll(async () => {
    stack = await startTestStack();
    app = fastify();

    await app.register(fp(buildApp), {
      config: { ...stack.config, NODE_ENV: 'test' },
    });

    await app.manager.start();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await stack.stop();
  });

  async function getAdminToken() {
    const res = await app.inject({
      method: 'POST',
      url: '/_test/token',
    });
    return JSON.parse(res.body).token;
  }

  it('should return 401 when accessing board without a token', async () => {
    const res = await app.inject({ method: 'GET', url: BOARD_PATH });
    expect(res.statusCode).toBe(401);
  });

  it('should allow access when using a token provided by the app itself', async () => {
    const token = await getAdminToken();

    const res = await app.inject({
      method: 'GET',
      url: BOARD_PATH,
      query: { token },
    });

    expect([200, 302, 303]).toContain(res.statusCode);
  });
});