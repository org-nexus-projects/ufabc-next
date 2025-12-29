import { MongoDBContainer } from '@testcontainers/mongodb';
import { RedisContainer } from '@testcontainers/redis';
import { LocalstackContainer } from '@testcontainers/localstack';
import { S3Client, CreateBucketCommand } from '@aws-sdk/client-s3';

export async function createTestContainers() {
  const mongo = await new MongoDBContainer('mongo:6').withReuse().start();
  const redis = await new RedisContainer('redis:7-alpine').withReuse().start();
  const localstack = await new LocalstackContainer('localstack/localstack:latest')
    .withReuse()
    .start();

  return {
    mongoUri: mongo.getConnectionString(),
    redisUri: redis.getConnectionUrl(),
    localstackUri: localstack.getConnectionUri(),
  };
}

export async function startTestStack() {
  const [mongo, redis, localstack] = await Promise.all([
    new MongoDBContainer('mongo:6').withReuse().start(),
    new RedisContainer('redis:7-alpine').withPassword('qj6wGxXINcQyWXdN').withReuse().start(),
    new LocalstackContainer('localstack/localstack:latest').withReuse().start(),
  ]);

  const localstackUrl = `http://${localstack.getHost()}:${localstack.getMappedPort(4566)}`;

  const s3 = new S3Client({
    endpoint: localstackUrl,
    region: 'us-east-1',
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
    forcePathStyle: true,
  });
  await s3.send(new CreateBucketCommand({ Bucket: 'ufabc-next' }));

  return {
    config: {
      MONGODB_CONNECTION_URL: mongo.getConnectionString(),
      REDIS_CONNECTION_URL: `redis://default:${redis.getPassword()}@${redis.getHost()}:${redis.getMappedPort(6379)}`,
      LOCALSTACK_ENDPOINT: localstackUrl,
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'test',
      AWS_SECRET_ACCESS_KEY: 'test',
      USE_LOCALSTACK: true,
      AWS_BUCKET: 'ufabc-next',
    },
    stop: async () => {
      await Promise.all([mongo.stop(), redis.stop(), localstack.stop()]);
    },
  };
}

export type TestStack = Awaited<ReturnType<typeof startTestStack>>;
