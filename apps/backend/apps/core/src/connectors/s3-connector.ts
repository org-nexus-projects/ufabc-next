import {
  ListObjectsV2Command,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import { BaseAWSConnector } from './base-aws-connector.js';

export class S3Connector extends BaseAWSConnector<S3Client> {
  async upload(
    bucket: string,
    key: string,
    body: Buffer | Uint8Array | Blob | string,
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
    return this.client.send(command);
  }
}
