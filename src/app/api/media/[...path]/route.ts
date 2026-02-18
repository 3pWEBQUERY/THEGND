import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

/**
 * S3 media proxy – streams objects from Tigris/S3 through our server.
 *
 * This is necessary because Tigris Object Storage does not honour
 * public-read ACLs, so all objects are private and must be fetched
 * with credentials.
 *
 * URL pattern: /api/media/<key>
 * Example:     /api/media/storyMedia/abc123.jpeg
 *
 * Responses are cached aggressively (1 year, immutable) since every
 * uploaded file gets a unique UUID-based key.
 */

let _client: S3Client | null = null
function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      endpoint: process.env.S3_ENDPOINT!,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
      forcePathStyle: true,
    })
  }
  return _client
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const key = path.join('/')

  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 })
  }

  try {
    const bucket = process.env.S3_BUCKET || 'uploads'
    const obj = await getClient().send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    )

    if (!obj.Body) {
      return NextResponse.json({ error: 'Empty body' }, { status: 404 })
    }

    // Stream the body through
    const byteArray = await obj.Body.transformToByteArray()

    return new NextResponse(Buffer.from(byteArray) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': obj.ContentType || 'application/octet-stream',
        'Content-Length': String(obj.ContentLength ?? byteArray.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('NoSuchKey') || message.includes('not found')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('[S3 Proxy] Error fetching key:', key, message)
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 })
  }
}
