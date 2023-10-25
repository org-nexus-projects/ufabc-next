import { createDecipheriv } from 'node:crypto';
import { Buffer } from 'node:buffer';

export function confirmToken(text: string, secretKey: string) {
  const ALGORITHM = 'aes-256-ctr';
  const ENCRYPTION_KEY = Buffer.from(secretKey, 'hex');
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.concat([Buffer.from(ENCRYPTION_KEY), Buffer.alloc(32)], 32),
    iv,
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
