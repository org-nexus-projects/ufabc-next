import { createDecipheriv } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { Config } from '@/config/config.js';

export function confirmToken(text: string) {
  const ALGORITHM = 'aes-256-ctr';
  const ENCRYPTION_KEY = Buffer.from(Config.JWT_SECRET, 'hex');
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.concat([Buffer.from(ENCRYPTION_KEY), Buffer.alloc(32)], 32),
    iv,
  );
  const decrypted = decipher.update(encryptedText);
  const finalDecrypted = Buffer.concat([decrypted, decipher.final()]);
  return finalDecrypted.toString();
}
