import env from '@fastify/env';
import type { FastifyEnvOptions } from '@fastify/env';
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
  ALLOWED_ORIGINS: z
    .string()
    .default(DEFAULT_ALLOWED_ORIGINS)
    .transform((origins) => origins.split(',')),
  AWS_ACCESS_KEY_ID: z.string().default('AWS_ACCESS_KEY_ID_LOCALSTACK'),
  AWS_BUCKET: z.string().default('ufabc-next'),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_SECRET_ACCESS_KEY: z.string().default('AWS_SECRET_ACCESS_KEY_LOCALSTACK'),
  AXIOM_DATASET: z.string().optional(),
  AXIOM_TOKEN: z.string().optional(),
  BACKOFFICE_EMAILS: z
    .string()
    .default('next.dev@aluno.ufabc.edu.br')
    .transform((emails) => emails.split(',')),
  BOARD_PATH: z.string().optional(),
  CRONOS_URL: z.string().default('http://localhost:5173'),
  EXTRACTOR_URL: z.string(),
  HOST: z.string().min(4).default('0.0.0.0'),
  INTERNAL_TOKEN: z.string().default('internal-token'),
  CMCC_URL: z.string().default('https://cds2.cmcc.ufabc.edu.br/planoensino/'),
  JWT_SECRET: z.string().default(JWT_SECRET),
  LOCALSTACK_ENDPOINT: z.string().default('http://localhost:4566'),
  MEMORY_SAMPLE_INTERVAL_SECONDS: z.coerce.number().default(60),
  MEMORY_SNAPSHOT_COOLDOWN_MINUTES: z.coerce.number().default(15),
  MEMORY_SNAPSHOT_THRESHOLD_MB: z.coerce.number().default(750),
  MONGODB_CONNECTION_URL: z
    .string()
    .default('mongodb://127.0.0.1:27017/ufabc-matricula'),
  MOODLE_URL: z.string().default('https://moodle.ufabc.edu.br'),
  NEXT_AGENT_URL: z.string(),
  NODE_ENV: z.enum(['dev', 'test', 'prod']).default('dev'),
  NOTION_DATABASE_ID: z.string().default('notion_database_id'),
  NOTION_INTEGRATION_SECRET: z.string().default('notion_integration_secret'),
  OAUTH_GOOGLE_CLIENT_ID: z.string(),
  OAUTH_GOOGLE_SECRET: z.string().min(16),
  PORT: z.coerce.number().default(5000),
  PROTOCOL: z.enum(['http', 'https']).default('http'),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  REDIS_CONNECTION_URL: z.string().default('redis://localhost:6379'),
  SERVICE_HEADER: z.string().default('service-header'),
  SIGAA_URL: z.string().default('https://sig.ufabc.edu.br'),
  UFABC_MATRICULA_URL: z.string().default('https://matricula.ufabc.edu.br'),
  UFABC_PARSER_REQUESTER_KEY: z.string(),
  UFABC_PARSER_URL: z.string().default('https://ufabc-parser.com'),
  UFABC_PARSER_WEBHOOK_SECRET: z.string().min(1),
  USE_LOCALSTACK: z.coerce.boolean().default(true),
  WEBHOOK_API_KEY: z.string().default('webhook-api-key'),
  WEB_URL: z.string().default(NEXT_WEB_LOCAL),
  WHATSAPP_AUTH_SECRET: z.string().optional(),
});

const schema = zodToJsonSchema(configSchema);

export type Config = z.infer<typeof configSchema>;
export const autoConfig = {
  confKey: 'config',
  dotenv: {
    path: process.env.ENV_FILE ?? '../../.env',
  },
  schema,
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
