import { PutObjectCommand } from '@aws-sdk/client-s3';
import {
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
  unlink,
} from 'node:fs/promises';
import { join } from 'node:path';
import { s3Client } from '@/lib/aws.service.js';
import type { QueueContext } from '../types.js';
import { existsSync } from 'node:fs';

const LOGS_DIR = join(process.cwd(), 'logs');
const ARCHIVE_DIR = join(LOGS_DIR, 'archive');

const DEFAULT_RETENTION_DAYS = 7;

export async function uploadLogsToS3(ctx: QueueContext<unknown>) {
  const bucket = process.env.AWS_LOGS_BUCKET;
  const localOnly = process.env.NODE_ENV === 'dev';

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
      (file) => file.startsWith('app-') && !file.includes('archive'),
    );
    ctx.app.log.info(
      {
        files,
        jobData: ctx.job.data,
        logFiles,
      },
      'Files encountered',
    );
    for (const file of logFiles) {
      const filePath = join(LOGS_DIR, file);
      ctx.app.log.info(`Processing file: ${file}: ${filePath}`);
      const stats = await stat(filePath);
      // const dayOld = Date.now() - stats.mtime.getTime() > 24 * 60 * 60 * 1000;
      // if (!dayOld) {
      //   continue;
      // }

      // if (!localOnly) {
        const fileContent = await readFile(filePath);
        ctx.app.log.info(`Read file: ${fileContent}`);
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: `logs/${file}`,
          Body: fileContent,
        });
        await s3Client.send(command);
        ctx.app.log.info(`Uploaded to S3: ${file}`);
      // }

      // Move to archive
      const archivePath = join(ARCHIVE_DIR, file);
      await rename(filePath, archivePath);
      ctx.app.log.info(`Archived: ${file}`);

      // Clean old archives
      const archiveStats = await stat(archivePath);
      const isOld =
        Date.now() - archiveStats.mtime.getTime() >
        DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

      if (isOld) {
        await unlink(archivePath);
        ctx.app.log.info(`Deleted old archive: ${file}`);
      }
    }
  } catch (error) {
    ctx.app.log.error({
      msg: 'Error managing log files',
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
