import { logger } from '@ufabcnext/common';
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
  HOST: z.string().min(4).default('localhost'),
  JWT_SECRET: z.string().min(32),
  // EMAIL
  EMAIL_CONFIRMATION_TEMPLATE: z.string(),
  MAILER_ID: z.string(),
  // Redis
  REDIS_NAME: z.string(),
  REDIS_USER: z.string().default('default'),
  REDIS_PASSWORD: z.string().min(8),
  REDIS_PORT: z.coerce.number().default(6379),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  logger.error({ issues: _env.error.format() }, '[QUEUE] Invalid Envs');
  throw new Error('Invalid environments variables');
}

export type Config = z.infer<typeof envSchema>;
export const Config = _env.data;
