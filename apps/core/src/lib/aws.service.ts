import { S3Client } from '@aws-sdk/client-s3';
import { SESClient } from '@aws-sdk/client-ses';

const LOCALSTACK_URL = 'http://localhost:4566';

export const sesClient = new SESClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  endpoint: process.env.NODE_ENV !== 'prod' ? LOCALSTACK_URL : undefined,
  credentials: {
    accessKeyId:
      process.env.AWS_ACCESS_KEY_ID ?? 'AWS_ACCESS_KEY_ID_LOCALSTACK',
    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY ?? 'AWS_SECRET_ACCESS_KEY_LOCALSTACK',
  },
});

export const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
  endpoint: process.env.NODE_ENV !== 'prod' ? LOCALSTACK_URL : undefined,
  forcePathStyle: process.env.USE_LOCALSTACK !== 'false', // Required for LocalStack S3
  credentials: {
    accessKeyId:
      process.env.AWS_ACCESS_KEY_ID ?? 'AWS_ACCESS_KEY_ID_LOCALSTACK',
    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY ?? 'AWS_SECRET_ACCESS_KEY_LOCALSTACK',
  },
});
