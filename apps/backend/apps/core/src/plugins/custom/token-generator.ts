import { fastifyPlugin as fp } from 'fastify-plugin';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';
import { promisify } from 'node:util';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_MAXMEM = 64 * 1024 * 1024; // 64MB max memory

type TokenData = {
  data: string;
  expiresAt: number;
};

declare module 'fastify' {
  export interface FastifyInstance {
    createToken: typeof createToken;
    verifyToken: typeof verifyToken;
  }
}

const scryptAsync = promisify(scryptSync);

async function generateKey(secret: string, salt: Buffer): Promise<Buffer> {
  return scryptAsync(secret, salt, KEY_LENGTH, {
    cost: SCRYPT_COST,
    blockSize: SCRYPT_BLOCK_SIZE,
    parallelization: SCRYPT_PARALLELIZATION,
    maxmem: SCRYPT_MAXMEM,
  }) as unknown as Buffer;
}

async function createToken(data: string, ttlSeconds: number, secret: string) {
  try {
    const salt = randomBytes(SALT_LENGTH);
    const key = await generateKey(secret, salt);

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    const tokenData: TokenData = {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    };

    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(tokenData), 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    const token = Buffer.concat([
      salt, // 16 bytes
      iv, // 12 bytes
      authTag, // 16 bytes
      encrypted, // variable length
    ]);

    return token.toString('base64url');
  } catch (error) {
    throw new Error('Token creation failed');
  }
}

async function verifyToken(
  token: string,
  secret: string,
): Promise<string | null> {
  try {
    const tokenBuffer = Buffer.from(token, 'base64url');

    const salt = tokenBuffer.subarray(0, SALT_LENGTH);
    const iv = tokenBuffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = tokenBuffer.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH,
    );
    const encrypted = tokenBuffer.subarray(
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH,
    );

    const key = await generateKey(secret, salt);

    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    const tokenData = JSON.parse(decrypted.toString('utf8')) as TokenData;

    // Check expiration
    if (tokenData.expiresAt < Date.now()) {
      return null;
    }

    return tokenData.data;
  } catch (error) {
    return null;
  }
}

export default fp(
  async (app) => {
    app.decorate('createToken', createToken);
    app.decorate('verifyToken', verifyToken);
  },
  {
    name: 'token-generator',
  },
);
