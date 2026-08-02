import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import type { S3Client } from '@aws-sdk/client-s3';

import { BaseAWSConnector } from './base-aws-connector.js';

export class S3Connector extends BaseAWSConnector<S3Client> {
  async upload(
    bucket: string,
    key: string,
    body: Buffer | Uint8Array | Blob | string
  ) {
    const command = new PutObjectCommand({
      Body: body,
      Bucket: bucket,
      Key: key,
    });
    return await this.client.send(command);
  }

  async getObject(bucket: string, key: string) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    return await this.client.send(command);
  }

  async list(bucket: string) {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
    });
    const result = await this.client.send(command);

    if (!result.Contents) {
      return [];
    }

    const files = [];
    for (const item of result.Contents) {
      files.push({
        key: item.Key,
        lastModified: item.LastModified,
        rawSize: item.Size,
        size: this.#formatFileSize(item.Size),
      });
    }
    return files;
  }

  #formatFileSize(size?: number) {
    if (!size) {
      return '0 B';
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }
}
