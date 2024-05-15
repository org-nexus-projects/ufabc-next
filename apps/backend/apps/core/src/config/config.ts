import { z } from 'zod';

const envSchema = z.object({
  ACCESS_KEY: z.string().min(6).max(16).default('verysecret'),
  NODE_ENV: z.enum(['dev', 'test', 'prod']).default('dev'),
  PORT: z.coerce.number().default(5000),
  PROTOCOL: z.enum(['http', 'https']).default('http'),
  HOST: z.string().min(4).default('localhost'),
  JWT_SECRET: z
    .string()
    .min(32)
    .default('SuperSecretKey@insaneSuperDuperBlaster'),

  // Replace with your own
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().default('AHUROUY6XAGX89PUFYNB'),
  AWS_SECRET_ACCESS_KEY: z
    .string()
    .default('DNUZ3E8IUOXULCQERTCXNC6BMZCV19UBNZOPWWS3'),

  // Replace with your own
  OAUTH_FACEBOOK_CLIENT_ID: z.string().default('4859485948'),
  OAUTH_FACEBOOK_SECRET: z.string().min(16).default('0sraUa6lA7oSdewe'),
  OAUTH_GOOGLE_CLIENT_ID: z
    .string()
    .default('12121212-random-generated-token.apps.googleusercontent.com'),
  OAUTH_GOOGLE_SECRET: z
    .string()
    .min(16)
    .default('GOCSPX-random-generated-token'),

  REDIS_NAME: z.string().default('ufabc-next-redis'),
  REDIS_USER: z.string().default('default'),
  REDIS_PASSWORD: z.string().min(8).default('localRedis'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  MONGODB_CONNECTION_URL: z
    .string()
    .default('mongodb://127.0.0.1:27017/next-db'),
  REDIS_CONNECTION_URL: z.string().optional(),
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
    WEB_URL_LOCAL: 'http://localhost:3000' as const,
    WEB_URL: 'https://www.ufabcnext.com/app' as const,
  }),
);
export type Config = EnvConfig & typeof Config;
