/**
 * S3-compatible storage client (Railway Object Storage / MinIO / AWS S3).
 *
 * Environment variables:
 *   S3_ENDPOINT        – e.g. https://s3.us-east-1.railway.app
 *   S3_BUCKET          – bucket name (default: "uploads")
 *   S3_ACCESS_KEY      – access key id
 *   S3_SECRET_KEY      – secret access key
 *   S3_REGION          – region (default: "us-east-1")
 *   NEXT_PUBLIC_S3_URL – public base URL for serving files
 *                        (may differ from endpoint when using CDN)
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

function getClient() {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT!,
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: true, // Required for MinIO / Railway S3
  })
}

let _client: S3Client | null = null
function client(): S3Client {
  if (!_client) _client = getClient()
  return _client
}

const bucket = () => process.env.S3_BUCKET || 'uploads'

/**
 * Build the public URL for an S3 object key.
 *
 * Because Tigris Object Storage does not honour public-read ACLs,
 * we serve all media through our own `/api/media/` proxy endpoint
 * which fetches from S3 with credentials.
 *
 * Returns a root-relative path ("/api/media/…") so it works in
 * both server and client contexts without hard-coding a host.
 */
export function getPublicUrl(key: string): string {
  return `/api/media/${key}`
}

/**
 * Upload a buffer to S3 and return the public URL.
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  await client().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    }),
  )
  return getPublicUrl(key)
}

/**
 * Delete an object from S3 by key.
 */
export async function deleteFromS3(key: string): Promise<void> {
  await client().send(
    new DeleteObjectCommand({
      Bucket: bucket(),
      Key: key,
    }),
  )
}
