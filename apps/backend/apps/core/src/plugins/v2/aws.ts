import { S3Connector } from '@/connectors/s3-connector.js';
import type { FastifyInstance } from 'fastify';
import { S3Client } from '@aws-sdk/client-s3';
import { fastifyPlugin as fp } from 'fastify-plugin';
import { getAWSClientOptions } from '@/utils/aws-client-options.js';

declare module 'fastify' {
  export interface FastifyInstance {
    aws: {
      s3: S3Connector;
    };
  }
}

export default fp(
  async (app: FastifyInstance) => {
    const clientOptions = getAWSClientOptions(app.config);
    const s3Client = new S3Client(clientOptions);

    const s3Connector = new S3Connector(s3Client);

    app.decorate('aws', {
      s3: s3Connector,
    });

    app.log.info(
      {
        localstack: app.config.USE_LOCALSTACK,
        endpoint: app.config.LOCALSTACK_ENDPOINT ?? 'native',
      },
      '[AWS] S3Connector available at app.aws.s3',
    );
  },
  { name: 'aws' },
);
