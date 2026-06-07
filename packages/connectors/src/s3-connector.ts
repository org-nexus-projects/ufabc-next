import {
  ListObjectsV2Command,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';

import { BaseAWSConnector } from './base-aws-connector.js';

let s3ConnectorInstance: S3Connector | null = null;

export class S3Connector extends BaseAWSConnector<S3Client> {
  constructor(client: S3Client, traceId?: string) {
    if (s3ConnectorInstance) {
      return s3ConnectorInstance
    };

    super(client, traceId);
    s3ConnectorInstance = this;
  }

  async upload(
    bucket: string,
    key: string,
    body: Buffer | Uint8Array | Blob | string
  ) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
    });
    return this.client.send(command);
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
        size: this.#formatFileSize(item.Size),
        rawSize: item.Size,
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
