import env, { type FastifyEnvOptions } from '@fastify/env';
import type { FastifyInstance } from 'fastify';
import { fastifyPlugin as fp } from 'fastify-plugin';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const NEXT_WEB_LOCAL = 'http://localhost:3000' as const;
const JWT_SECRET = 'LWp9YJMiUtfQxoepoTL7RkWJi6W5C6ED';
const DEFAULT_ALLOWED_ORIGINS = [
  'https://sig.ufabc.edu.br',
  'https://matricula.ufabc.edu.br/',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://ufabc-matricula-snapshot.vercel.app/',
  'http://localhost:3003/',
  'https://moodle.ufabc.edu.br',
].join(',');

const configSchema = z.object({
  PROTOCOL: z.enum(['http', 'https']).default('http'),
  NODE_ENV: z.enum(['dev', 'test', 'prod']).default('dev'),
  PORT: z.coerce.number().default(5000),
  HOST: z.string().min(4).default('0.0.0.0'),
  JWT_SECRET: z.string().default(JWT_SECRET),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  MONGODB_CONNECTION_URL: z
    .string()
    .default('mongodb://127.0.0.1:27017/ufabc-matricula'),
  REDIS_CONNECTION_URL: z.string().default('redis://localhost:6379'),
  WEB_URL: z.string().default(NEXT_WEB_LOCAL),
  CRONOS_URL: z.string().default('http://localhost:5173'),
  ALLOWED_ORIGINS: z
    .string()
    .default(DEFAULT_ALLOWED_ORIGINS)
    .transform((origins) => origins.split(',')),
  UFABC_PARSER_URL: z.string().default('https://ufabc-parser.com'),
  MOODLE_URL: z.string().default('https://moodle.ufabc.edu.br'),
  SIGAA_URL: z.string().default('https://sig.ufabc.edu.br'),
  UFABC_MATRICULA_URL: z.string().default('https://matricula.ufabc.edu.br'),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().default('AWS_ACCESS_KEY_ID_LOCALSTACK'),
  NEXT_AGENT_URL: z.string(),
  COMMUNICATIONS_API_URL: z
    .string()
    .default('https://communications.fundacaonexus.com/v2'),
  SERVICE_HEADER: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().default('AWS_SECRET_ACCESS_KEY_LOCALSTACK'),
  USE_LOCALSTACK: z.coerce.boolean().default(true),
  LOCALSTACK_ENDPOINT: z.string().default('http://localhost:4566'),
  AWS_BUCKET: z.string().default('ufabc-next'),
  OAUTH_GOOGLE_CLIENT_ID: z.string(),
  OAUTH_GOOGLE_SECRET: z.string().min(16),
  BACKOFFICE_EMAILS: z
    .string()
    .default('next.dev@aluno.ufabc.edu.br')
    .transform((emails) => emails.split(',')),
  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET: z.string().optional(),
  MEMORY_SNAPSHOT_THRESHOLD_MB: z.coerce.number().default(750),
  MEMORY_SAMPLE_INTERVAL_SECONDS: z.coerce.number().default(60),
  MEMORY_SNAPSHOT_COOLDOWN_MINUTES: z.coerce.number().default(15),
  BOARD_PATH: z.string().optional(),
  NOTION_INTEGRATION_SECRET: z.string().default('notion_integration_secret'),
  NOTION_DATABASE_ID: z.string().default('notion_database_id'),
  UFABC_PARSER_REQUESTER_KEY: z.string(),
  WEBHOOK_API_KEY: z.string().default('webhook-api-key'),
  UFABC_PARSER_WEBHOOK_SECRET: z.string().optional(),
  WHATSAPP_AUTH_SECRET: z.string().optional(),
  INTERNAL_TOKEN: z.string().default('internal-token'),
});

const schema = zodToJsonSchema(configSchema);

export type Config = z.infer<typeof configSchema>;
export const autoConfig = {
  schema,
  dotenv: {
    path: process.env.ENV_FILE ?? '../../.env',
  },
  confKey: 'config',
} satisfies FastifyEnvOptions;

/**
 * This plugins helps to check environment variables.
 *
 * @see {@link https://github.com/fastify/fastify-env}
 */
export default fp(
  async (app: FastifyInstance) => {
    await app.register(env, autoConfig);
  },
  { name: 'config' }
);
