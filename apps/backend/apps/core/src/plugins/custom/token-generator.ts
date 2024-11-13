import { fastifyPlugin as fp } from 'fastify-plugin';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  export interface FastifyInstance {
    createToken: typeof createToken;
    verifyToken: typeof verifyToken;
  }
}

type TokenPayload = {
  data: string;
  expiresAt: number;
};

function createToken(
  text: string,
  config: FastifyInstance['config'],
  ttlSeconds = 3600,
): string {
  // Validate inputs
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }
  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new Error('Invalid TTL: must be a positive integer');
  }

  const ALGORITHM = 'aes-256-gcm';
  const IV_LENGTH = 12;
  const AUTH_TAG_LENGTH = 16;

  const key = createHash('sha256').update(config.JWT_SECRET).digest();

  const payload: TokenPayload = {
    data: text,
    expiresAt: Math.floor(Date.now() / 1000) + ttlSeconds,
  };

  // Generate random IV
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const jsonPayload = JSON.stringify(payload);
  const encrypted = Buffer.concat([
    cipher.update(jsonPayload, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  const tokenComponents = {
    iv: iv.toString('base64'),
    data: encrypted.toString('base64'),
    tag: authTag.toString('base64'),
  };

  return Buffer.from(JSON.stringify(tokenComponents)).toString('base64');
}

function verifyToken(token: string, config: FastifyInstance['config']): string {
  try {
    // Decode token components
    const components = JSON.parse(
      Buffer.from(token, 'base64').toString('utf8'),
    ) as { iv: string; data: string; tag: string };

    // Validate token structure
    if (!components.iv || !components.data || !components.tag) {
      throw new Error('Invalid token structure');
    }

    // Recreate decipher
    const decipher = createDecipheriv(
      'aes-256-gcm',
      createHash('sha256').update(config.JWT_SECRET).digest(),
      Buffer.from(components.iv, 'base64'),
    );

    // Set auth tag
    decipher.setAuthTag(Buffer.from(components.tag, 'base64'));

    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(components.data, 'base64')),
      decipher.final(),
    ]);

    // Parse payload
    const payload = JSON.parse(decrypted.toString('utf8')) as TokenPayload;

    // Check expiration
    if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
      throw new Error('Token has expired');
    }

    return payload.data;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export default fp(
  async (app) => {
    app.decorate('createToken', createToken);
    app.decorate('verifyToken', verifyToken);

    app.log.warn('[PLUGIN] registered tokens plugin');
  },
  {
    name: 'token-generator',
  },
);
