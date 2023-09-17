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
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('invalid envs', _env.error.format());
  throw new Error('Invalid environments variables');
}

export type Config = z.infer<typeof envSchema>;
export const Config = _env.data;
