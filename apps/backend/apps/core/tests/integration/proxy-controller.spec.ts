import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { fastify, type FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { proxyController } from '../../src/controllers/proxy-controller.js';
import { setupV2Routes } from '../../src/plugins/v2/setup.js';

describe('POST /v2/groups/announcements', () => {
  let app: FastifyInstance;
  let server: Server;
  let communicationsApiUrl: string;
  let proxiedBody: unknown;

  beforeAll(async () => {
    server = createServer((request, response) => {
      if (
        request.method !== 'POST' ||
        request.url !== '/v2/groups/announcements'
      ) {
        response.writeHead(404);
        response.end();
        return;
      }

      let rawBody = '';
      request.on('data', (chunk: Buffer) => {
        rawBody += chunk.toString('utf8');
      });
      request.on('end', () => {
        proxiedBody = JSON.parse(rawBody);
        response.writeHead(202, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ message: 'Announcement queued' }));
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });

    const address = server.address() as AddressInfo;
    communicationsApiUrl = `http://127.0.0.1:${address.port}/v2`;

    app = fastify({ logger: false });
    app.decorate('config', { COMMUNICATIONS_API_URL: communicationsApiUrl });

    await setupV2Routes(app, [proxyController]);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it('proxies announcement requests to the communications API contract', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v2/groups/announcements',
      payload: {
        courseIdentifier: 123,
        season: '2026:1',
        text: 'Class starts tomorrow',
      },
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({ message: 'Announcement queued' });
    expect(proxiedBody).toEqual({
      courseIdentifier: 123,
      season: '2026:1',
      message: 'Class starts tomorrow',
    });
  });
});
