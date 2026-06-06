import type { Config } from '@/plugins/external/config.js';

export function getAWSClientOptions(config: Config) {
  const baseConfig = {
    region: config.AWS_REGION,
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
  };

  if (config.USE_LOCALSTACK) {
    return {
      ...baseConfig,
      endpoint: config.LOCALSTACK_ENDPOINT,
      forcePathStyle: true, // Required for LocalStack S3
      tls: false, // LocalStack usually runs on http
    };
  }

  return baseConfig;
}
