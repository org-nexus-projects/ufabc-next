import { createCipheriv, randomBytes } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { Config } from '../config/config.js';

const ALGORITHM = 'aes-256-ctr';
const ENCRYPTION_KEY = Buffer.from(Config.JWT_SECRET, 'hex');
export function createToken(text: string) {
  const IV_LENGTH = 16;
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(
    ALGORITHM,
    Buffer.concat([Buffer.from(ENCRYPTION_KEY), Buffer.alloc(32)], 32),
    iv,
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}
