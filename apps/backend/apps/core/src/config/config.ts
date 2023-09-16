import { config as dotEnvConfig } from 'dotenv';
import { z } from 'zod';

if (process.env.NODE_ENV === 'test') {
  dotEnvConfig({ path: '.env.test' });
} else {
  dotEnvConfig();
}

const envSchema = z.object({
  // Local machine
  NODE_ENV: z.enum(['dev', 'test', 'prod']).default('dev'),
  PORT: z.coerce.number().default(5000),
  HOST: z.string().min(4).default('localhost'),

  // default to legacy front-end url
  WEB_URL: z.string().url().default('http://localhost:7500/app/#'),
  // Random string
  JWT_SECRET: z.string().min(32).default('as4MDFhi0OxGtfQCO6wFC68H5qdZ4zpc'),

  // AWS credentials - change with the ones from your account
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().default('AHUROUY6XAGX89PUFYNB'),
  AWS_SECRET_ACCESS_KEY: z
    .string()
    .default('DNUZ3E8IUOXULCQERTCXNC6BMZCV19UBNZOPWWS3'),

  // Ses E-mail
  EMAIL_CONFIRMATION_TEMPLATE: z.string().default('Confirmation'),
  EMAIL_RECOVERY_TEMPLATE: z.string().default('Recovery'),
  EMAIL: z.string().email().default('contato@ufabcnext.com'),
  MAILER_ID: z.string().optional(),

  // OAUTH2 - Change with the one you generate
  OAUTH_FACEBOOK_CLIENT_ID: z.string().default('4859485948'),
  OAUTH_FACEBOOK_SECRET: z.string().min(16).default('0sraUa6lA7oSdewe'),
  OAUTH_GOOGLE_CLIENT_ID: z
    .string()
    .default('12121212-random-generated-token.apps.googleusercontent.com'),
  OAUTH_GOOGLE_SECRET: z
    .string()
    .min(16)
    .default('GOCSPX-random-generated-token'),

  // MONGODB
  MONGODB_NAME: z.string().default('ufabc-next-backend'),
  MONGODB_USER: z.string().default('localUser'),
  MONGODB_PASSWORD: z.string().min(6).default('localSecret'),
  MONGODB_PORT: z.coerce.number().default(27017),

  // Redis
  REDIS_NAME: z.string().default('ufabc-next-redis'),
  REDIS_USER: z.string().default('default'),
  REDIS_PASSWORD: z.string().min(8).default('localRedis'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),

  // Docker URL
  MONGODB_CONNECTION_URL: z
    .string()
    .default(`mongodb://localUser:localSecret@127.0.0.1:27017`),
  REDIS_CONNECTION_URL: z
    .string()
    .default('redis://default:localRedis@127.0.0.1:6379'),
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

export type Config = z.infer<typeof envSchema>;
export const Config = _env.data;
