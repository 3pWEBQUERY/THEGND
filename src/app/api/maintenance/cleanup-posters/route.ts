import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import { promises as fs } from 'fs'

export const runtime = 'nodejs'

// Simple cron protection via secret header or query param
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.get('x-cron-secret')
  const urlSecret = req.nextUrl.searchParams.get('secret')
  return header === secret || urlSecret === secret
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = Date.now()
    const graceMs = 2 * 60 * 60 * 1000 // 2h grace after last referencing story expired
    const projectRoot = process.cwd()
    const postersDir = path.join(projectRoot, 'public', 'uploads', 'posters')

    // Ensure directory exists
    try { await fs.mkdir(postersDir, { recursive: true }) } catch {}

    // Map of poster filename -> latest expiresAt among stories referencing it
    const posterStories = await prisma.story.findMany({
      where: { image: { startsWith: '/uploads/posters/' } },
      select: { image: true, expiresAt: true },
    })
    const posterMaxExpires = new Map<string, number>()
    for (const s of posterStories) {
      const img = s.image as string | null
      if (!img) continue
      const base = path.basename(img)
      const exp = s.expiresAt ? new Date(s.expiresAt).getTime() : 0
      const prev = posterMaxExpires.get(base) ?? 0
      if (exp > prev) posterMaxExpires.set(base, exp)
    }

    const entries = await fs.readdir(postersDir, { withFileTypes: true })
    let deleted = 0
    const kept: string[] = []
    for (const ent of entries) {
      if (!ent.isFile()) continue
      const fname = ent.name
      const abs = path.join(postersDir, fname)
      try {
        const latestExpires = posterMaxExpires.get(fname)
        const referenced = typeof latestExpires === 'number'
        const safeToDelete = !referenced || now > (latestExpires + graceMs)
        if (safeToDelete) {
          await fs.unlink(abs)
          deleted += 1
        } else {
          kept.push(fname)
        }
      } catch {
        // ignore errors per file
      }
    }

    return NextResponse.json({ status: 'ok', deleted, keptCount: kept.length })
  } catch (e) {
    console.error('cleanup-posters failed', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
