import type { FastifyInstance } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';

import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';

declare module 'fastify' {
  interface FastifyInstance {
    createUfabcParserConnector(globalTraceId?: string): UfabcParserConnector;
  }
}

export default fp(
  async (app: FastifyInstance) => {
    app.decorate(
      'createUfabcParserConnector',
      (globalTraceId?: string) =>
        new UfabcParserConnector(app.config, globalTraceId)
    );
  },
  {
    name: 'ufabc-parser-connector',
    dependencies: ['config'],
  }
);
