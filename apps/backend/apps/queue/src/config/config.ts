import { z } from 'zod';
// only in dev - Vitest doesn't support node --env-file
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['dev', 'test', 'prod']).default('dev'),
  JWT_SECRET: z.string().min(32),

  // Replace with your own
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),

  REDIS_NAME: z.string(),
  REDIS_USER: z.string(),
  REDIS_PASSWORD: z.string().min(8),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number(),
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
export const Config = Object.freeze(_env.data);
