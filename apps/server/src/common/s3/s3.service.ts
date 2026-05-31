import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from 'src/common/config';

const DEFAULT_PRESIGNED_TTL_SECONDS = 3600;

@Injectable()
export class S3Service {
  private readonly client = new S3Client({
    region: config.s3.region,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
  });

  async uploadRecording(key: string, body: Buffer): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: config.s3.bucketName,
        Key: key,
        Body: body,
        ContentType: 'video/mp4',
      })
    );
  }

  async getPresignedRecordingUrl(key: string, expiresInSeconds = DEFAULT_PRESIGNED_TTL_SECONDS): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: config.s3.bucketName, Key: key }), {
      expiresIn: expiresInSeconds,
    });
  }
}
