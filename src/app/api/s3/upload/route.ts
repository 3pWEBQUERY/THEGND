import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToS3 } from '@/lib/s3'
import { applyWatermarkToImageBuffer } from '@/lib/watermark'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

// ── Endpoint definitions (replaces UploadThing core router) ────────────────

interface MediaConstraint {
  maxSize: number
  maxCount: number
}

interface EndpointConfig {
  image?: MediaConstraint
  video?: MediaConstraint
  auth: boolean
  roles?: string[]
  watermark?: boolean
}

const ENDPOINTS: Record<string, EndpointConfig> = {
  storyMedia: {
    image: { maxSize: 16 * 1024 * 1024, maxCount: 10 },
    video: { maxSize: 256 * 1024 * 1024, maxCount: 2 },
    auth: true,
    watermark: true,
  },
  postImages: {
    image: { maxSize: 16 * 1024 * 1024, maxCount: 10 },
    auth: false,
  },
  rentalMedia: {
    image: { maxSize: 8 * 1024 * 1024, maxCount: 10 },
    auth: true,
    roles: ['AGENCY', 'CLUB', 'STUDIO'],
  },
  verificationDocs: {
    image: { maxSize: 16 * 1024 * 1024, maxCount: 3 },
    video: { maxSize: 256 * 1024 * 1024, maxCount: 1 },
    auth: false,
  },
  adAssets: {
    image: { maxSize: 16 * 1024 * 1024, maxCount: 5 },
    auth: false,
  },
  forumAssets: {
    image: { maxSize: 16 * 1024 * 1024, maxCount: 10 },
    auth: false,
  },
  jobMedia: {
    image: { maxSize: 8 * 1024 * 1024, maxCount: 6 },
    auth: true,
    roles: ['AGENCY', 'CLUB', 'STUDIO'],
  },
  siteAssets: {
    image: { maxSize: 8 * 1024 * 1024, maxCount: 5 },
    auth: true,
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ext(filename: string, fallback: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : fallback
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const endpoint = formData.get('endpoint') as string | null
    const files = formData.getAll('files') as File[]

    if (!endpoint || !ENDPOINTS[endpoint]) {
      return NextResponse.json(
        { error: `Ungültiger Upload-Endpoint: ${endpoint}` },
        { status: 400 },
      )
    }
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Keine Dateien übermittelt.' },
        { status: 400 },
      )
    }

    const config = ENDPOINTS[endpoint]

    // ── Auth ───────────────────────────────────────────────────────────────
    let userId: string | null = null
    let displayName: string | null = null

    if (config.auth) {
      const session = (await getServerSession(authOptions as any)) as any
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = session.user.id

      // Role check
      if (config.roles && userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { userType: true },
        })
        if (!user || !config.roles.includes(user.userType)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }

      // Display name for watermarking
      if (config.watermark && userId) {
        try {
          const prof = await prisma.profile.findUnique({
            where: { userId },
            select: { displayName: true },
          })
          displayName =
            prof?.displayName ||
            (session.user as any).email?.split('@')[0] ||
            ''
        } catch {
          displayName = (session.user as any).email?.split('@')[0] || ''
        }
      }
    }

    // ── Validate file counts ───────────────────────────────────────────────
    let imageCount = 0
    let videoCount = 0

    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && !isVideo) {
        return NextResponse.json(
          { error: `Ungültiger Dateityp: ${file.type}` },
          { status: 400 },
        )
      }

      if (isImage) {
        imageCount++
        if (!config.image) {
          return NextResponse.json(
            { error: `Bilder sind für "${endpoint}" nicht erlaubt.` },
            { status: 400 },
          )
        }
        if (file.size > config.image.maxSize) {
          return NextResponse.json(
            {
              error: `Bild zu groß: ${file.name} (max ${Math.round(config.image.maxSize / 1024 / 1024)}MB)`,
            },
            { status: 400 },
          )
        }
        if (imageCount > config.image.maxCount) {
          return NextResponse.json(
            {
              error: `Zu viele Bilder (max ${config.image.maxCount})`,
            },
            { status: 400 },
          )
        }
      }

      if (isVideo) {
        videoCount++
        if (!config.video) {
          return NextResponse.json(
            { error: `Videos sind für "${endpoint}" nicht erlaubt.` },
            { status: 400 },
          )
        }
        if (file.size > config.video.maxSize) {
          return NextResponse.json(
            {
              error: `Video zu groß: ${file.name} (max ${Math.round(config.video.maxSize / 1024 / 1024)}MB)`,
            },
            { status: 400 },
          )
        }
        if (videoCount > config.video.maxCount) {
          return NextResponse.json(
            {
              error: `Zu viele Videos (max ${config.video.maxCount})`,
            },
            { status: 400 },
          )
        }
      }
    }

    // ── Upload each file to S3 ─────────────────────────────────────────────
    const results: { url: string; type: string; key: string }[] = []

    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const fileExt = ext(file.name, isImage ? 'jpg' : 'mp4')
      const key = `${endpoint}/${uuidv4()}.${fileExt}`

      let buffer: Buffer = Buffer.from(await file.arrayBuffer())
      let contentType = file.type

      // Apply watermark for storyMedia images
      if (config.watermark && isImage) {
        try {
          buffer = await applyWatermarkToImageBuffer(
            buffer as Buffer<ArrayBuffer>,
            displayName || undefined,
          )
          contentType = 'image/jpeg'
        } catch {
          // If watermarking fails, upload original
        }
      }

      const url = await uploadToS3(buffer, key, contentType)
      results.push({ url, type: contentType, key })
    }

    return NextResponse.json({ files: results })
  } catch (e: any) {
    console.error('S3 upload error:', e)
    return NextResponse.json(
      { error: e?.message || 'Upload fehlgeschlagen.' },
      { status: 500 },
    )
  }
}
