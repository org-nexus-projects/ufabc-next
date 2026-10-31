import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import mongoose from 'mongoose';
import { z } from 'zod';

const { MongoClient, BSON } = mongoose.mongo;

const documentSchema = z.record(z.unknown());
type Document = z.infer<typeof documentSchema>;

const MAX_DOCUMENTS = 200;
const QUERY_TIMEOUT_MS = 20_000;

const FORBIDDEN_OPERATORS = new Set([
  '$out',
  '$merge',
  '$function',
  '$accumulator',
  '$where',
]);

export function isReadOnlyMode(env: NodeJS.ProcessEnv) {
  return env.MONGODB_MCP_READ_ONLY !== 'false';
}

export function capLimit(requestedLimit?: number) {
  if (requestedLimit === undefined) {
    return MAX_DOCUMENTS;
  }
  return Math.min(requestedLimit, MAX_DOCUMENTS);
}

export function assertReadOnlyValue(value: unknown) {
  if (Array.isArray(value)) {
    for (const item of value) {
      assertReadOnlyValue(item);
    }
    return;
  }

  if (value === null || typeof value !== 'object') {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (FORBIDDEN_OPERATORS.has(key)) {
      throw new Error(`Operator ${key} is not allowed in read-only mode`);
    }
    assertReadOnlyValue(nestedValue);
  }
}

function parseExtendedJson(value: Document): Document {
  return documentSchema.parse(BSON.EJSON.deserialize(structuredClone(value)));
}

function parseExtendedJsonList(values: Document[]) {
  const parsedValues: Document[] = [];
  for (const value of values) {
    parsedValues.push(parseExtendedJson(value));
  }
  return parsedValues;
}

function toToolResult(payload: unknown) {
  return {
    content: [
      {
        text: BSON.EJSON.stringify(payload, undefined, 2, { relaxed: true }),
        type: 'text' as const,
      },
    ],
  };
}

function toToolError(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return {
    content: [{ text: `Query failed: ${errorMessage}`, type: 'text' as const }],
    isError: true,
  };
}

async function main() {
  const localEnvFileUrl = new URL('../../../apps/core/.env', import.meta.url);
  if (
    process.env.MONGODB_MCP_URL === undefined &&
    existsSync(localEnvFileUrl)
  ) {
    loadEnvFile(localEnvFileUrl);
  }

  const connectionUrl = process.env.MONGODB_MCP_URL;
  if (connectionUrl === undefined || connectionUrl === '') {
    throw new Error('MONGODB_MCP_URL environment variable is required');
  }

  const readOnly = isReadOnlyMode(process.env);
  const client = new MongoClient(connectionUrl, {
    appName: 'next-mongodb-mcp',
    serverSelectionTimeoutMS: 15_000,
  });
  await client.connect();
  const database = client.db();

  const server = new McpServer({ name: 'mongodb-mcp', version: '0.1.0' });

  server.registerTool(
    'mongodb_list_collections',
    {
      description: 'List the collection names of the connected database.',
      inputSchema: {},
    },
    async () => {
      try {
        const collections = await database.listCollections().toArray();
        const names: string[] = [];
        for (const collection of collections) {
          names.push(collection.name);
        }
        return toToolResult(names);
      } catch (error) {
        return toToolError(error);
      }
    }
  );

  server.registerTool(
    'mongodb_find',
    {
      description: `Find documents in a collection (Extended JSON filter). Returns at most ${MAX_DOCUMENTS} documents.`,
      inputSchema: {
        collection: z.string().min(1),
        filter: z.record(z.unknown()).default({}),
        limit: z.number().int().positive().optional(),
        projection: z.record(z.unknown()).optional(),
        sort: z.record(z.unknown()).optional(),
      },
    },
    async ({
      collection,
      filter,
      projection,
      sort,
      limit,
    }: {
      collection: string;
      filter: Document;
      limit?: number;
      projection?: Document;
      sort?: Document;
    }) => {
      try {
        const parsedFilter = parseExtendedJson(filter);
        if (readOnly) {
          assertReadOnlyValue(parsedFilter);
        }

        const pipeline: Document[] = [{ $match: parsedFilter }];
        if (sort !== undefined) {
          pipeline.push({ $sort: parseExtendedJson(sort) });
        }
        pipeline.push({ $limit: capLimit(limit) });
        if (projection !== undefined) {
          pipeline.push({ $project: parseExtendedJson(projection) });
        }

        const documents = await database
          .collection(collection)
          .aggregate(pipeline, { maxTimeMS: QUERY_TIMEOUT_MS })
          .toArray();

        return toToolResult(documents);
      } catch (error) {
        return toToolError(error);
      }
    }
  );

  server.registerTool(
    'mongodb_aggregate',
    {
      description: `Run an aggregation pipeline (Extended JSON stages). Read-only unless MONGODB_MCP_READ_ONLY=false: $out, $merge, $function, $accumulator and $where are rejected. A $limit of ${MAX_DOCUMENTS} is appended.`,
      inputSchema: {
        collection: z.string().min(1),
        pipeline: z.array(z.record(z.unknown())),
      },
    },
    async ({
      collection,
      pipeline,
    }: {
      collection: string;
      pipeline: Document[];
    }) => {
      try {
        const parsedPipeline = parseExtendedJsonList(pipeline);
        if (readOnly) {
          assertReadOnlyValue(parsedPipeline);
        }

        const cappedPipeline = [...parsedPipeline, { $limit: MAX_DOCUMENTS }];
        const documents = await database
          .collection(collection)
          .aggregate(cappedPipeline, { maxTimeMS: QUERY_TIMEOUT_MS })
          .toArray();

        return toToolResult(documents);
      } catch (error) {
        return toToolError(error);
      }
    }
  );

  server.registerTool(
    'mongodb_count',
    {
      description: 'Count documents matching a filter (Extended JSON).',
      inputSchema: {
        collection: z.string().min(1),
        filter: z.record(z.unknown()).default({}),
      },
    },
    async ({
      collection,
      filter,
    }: {
      collection: string;
      filter: Document;
    }) => {
      try {
        const parsedFilter = parseExtendedJson(filter);
        if (readOnly) {
          assertReadOnlyValue(parsedFilter);
        }

        const total = await database
          .collection(collection)
          .countDocuments(parsedFilter, { maxTimeMS: QUERY_TIMEOUT_MS });

        return toToolResult({ count: total });
      } catch (error) {
        return toToolError(error);
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1] === import.meta.filename) {
  try {
    await main();
  } catch (error) {
    process.stderr.write(`mongodb-mcp failed to start: ${String(error)}\n`);
    process.exit(1);
  }
}
