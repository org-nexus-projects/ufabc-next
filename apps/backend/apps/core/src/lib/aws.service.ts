import { S3Client } from '@aws-sdk/client-s3';
import { SESClient } from '@aws-sdk/client-ses';

export const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1", // Default to us-east-1 for LocalStack
  endpoint: process.env.USE_LOCALSTACK === "true" ? "http://localhost:4566" : undefined, // Use LocalStack if enabled
  forcePathStyle: process.env.USE_LOCALSTACK === "true", // Required for LocalStack S3
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "AWS_ACCESS_KEY_ID_LOCALSTACK", // Default LocalStack credentials
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "AWS_SECRET_ACCESS_KEY_LOCALSTACK", // Default LocalStack credentials
  },
});

