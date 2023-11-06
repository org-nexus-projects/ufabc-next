import assert from 'node:assert/strict';
import { buildApp } from '@/app.js';
import type { FastifyInstance } from 'fastify';

describe('Server', () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should start', async () => {
    app.get('/test', () => ({ msg: 'welcome' }));
    await app.listen();
    const [address] = app.addresses();
    const response = await fetch(`http://localhost:${address?.port}/test`);

    assert.deepEqual(response.status, 200);
    assert.deepEqual(
      response.headers.get('content-type'),
      'application/json; charset=utf-8',
    );
    assert.deepStrictEqual(await response.json(), { msg: 'welcome' });
  });
});
