import { readdir, readFile, unlink } from 'node:fs/promises';
import type { QueueContext } from '../types.js';
import { join } from 'node:path';
import { s3Client } from '@/lib/aws.service.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';

type S3UploadJob = {
  folderPath: string;
  bucket: string;
};

export async function uploadLogsToS3(ctx: QueueContext<S3UploadJob>) {
  const {
    data: { folderPath, bucket },
  } = ctx.job;

  try {
    const files = await readdir(folderPath);
    const logFiles = files.filter((file) => file.startsWith('app-'));

    for (const file of logFiles) {
      const filePath = join(folderPath, file);
      const fileContent = await readFile(filePath);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: `logs/${file}`,
          Body: fileContent,
        }),
      );

      // delete after upload
      await unlink(filePath);

      ctx.app.log.debug({
        msg: 'Log file uploaded to S3',
        file,
        bucket,
      });
    }
  } catch (error) {
    ctx.app.log.error({
      msg: 'Error uploading logs to S3',
      error: error instanceof Error ? error.message : String(error),
      folderPath,
      bucket,
    });
    throw error;
  }
}
