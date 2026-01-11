import { PutObjectCommand } from '@aws-sdk/client-s3';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { s3Client } from '@/lib/aws.service.js';

import type { QueueContext } from '../types.js';

const LOGS_DIR = join(process.cwd(), 'logs');
const ARCHIVE_DIR = join(LOGS_DIR, 'archive');

export async function uploadLogsToS3(ctx: QueueContext<unknown>) {
  const bucket = process.env.AWS_BUCKET;

  try {
    ctx.app.log.info('init logs processing');

    if (!existsSync(LOGS_DIR)) {
      ctx.app.log.warn('No logs directory found, skipping...');
      return;
    }

    if (!existsSync(ARCHIVE_DIR)) {
      await mkdir(ARCHIVE_DIR, { recursive: true });
    }

    const files = await readdir(LOGS_DIR);
    const logFiles = files.filter(
      (file) => file.startsWith('app-') && !file.includes('archive')
    );

    for (const file of logFiles) {
      const filePath = join(LOGS_DIR, file);
      const fileContent = await readFile(filePath);
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: `logs/${file}`,
        Body: fileContent,
      });
      await s3Client.send(command);
      ctx.app.log.info(`Uploaded to S3: ${file}`);
    }
  } catch (error) {
    ctx.app.log.error({
      msg: 'Error managing log files',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
