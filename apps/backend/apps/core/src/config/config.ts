import { networkInterfaces } from 'node:os';
import { z } from 'zod';

const addresses = Object.values(networkInterfaces()).flat();
const { address } = addresses.find(
  (address) => address?.family === 'IPv4' && !address?.internal,
) ?? { address: 'localhost' };

const NEXT_WEB_LOCAL = 'http://localhost:3000' as const;
const JWT_SECRET = 'LWp9YJMiUtfQxoepoTL7RkWJi6W5C6ED';

const envSchema = z.object({
  PROTOCOL: z.enum(['http', 'https']).default('http'),
  NODE_ENV: z.enum(['dev', 'test', 'prod']).default('dev'),
  PORT: z.coerce.number().default(5000),
  HOST: z.string().min(4).default('0.0.0.0'),
  JWT_SECRET: z.string().min(32).default(JWT_SECRET),
  MONGODB_CONNECTION_URL: z.string().default('mongodb://127.0.0.1:27017/local'),
  REDIS_CONNECTION_URL: z.string().default('redis://localhost:6379'),
  WEB_URL: z.string().default(NEXT_WEB_LOCAL),
  ALLOWED_ORIGINS: z.string().transform((origins) => origins.split(',')),
  P_STAGING_DIR: z.string().default('/logs-local'),
  P_ADDR: z.string().default(`${address}:8000`),
  P_USERNAME: z.string().default('next-logs'),
  P_PASSWORD: z.string().default('logs-password'),
  P_S3_BUCKET: z.string().default('local'),
  P_S3_URL: z.string().url().optional(),
  P_S3_ACCESS_KEY: z.string().optional(),
  P_S3_SECRET_KEY: z.string().optional(),
  P_S3_REGION: z.string().optional(),
  UF_PROCESSOR_URL: z.string().url(),
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  OAUTH_GOOGLE_CLIENT_ID: z.string(),
  OAUTH_GOOGLE_SECRET: z.string().min(16),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  const { fieldErrors } = _env.error.flatten();
  const errorMessage = Object.entries(fieldErrors)
    .map(([field, errors]) =>
      errors ? `${field}: ${errors.join(', ')}` : field,
    )
    .join('\n  ');
  throw new Error(`Missing environment variables:\n  ${errorMessage}`);
}

type EnvConfig = z.infer<typeof envSchema>;

export const Config = Object.freeze(
  Object.assign(_env.data, {
    MAILER_CONFIG: {
      EMAIL_CONFIRMATION_TEMPLATE: 'Confirmation',
      EMAIL_RECOVERY_TEMPLATE: 'Recovery',
      EMAIL: 'contato@ufabcnext.com',
    } as const,
  }),
);
export type Config = EnvConfig & typeof Config;
