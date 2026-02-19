import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST — Increment hit count for a redirect (called after redirect match)
 */
export async function POST(req: Request) {
  try {
    const { sourcePath } = await req.json()
    if (!sourcePath) return NextResponse.json({ error: 'sourcePath required' }, { status: 400 })
    await prisma.seoRedirect.updateMany({
      where: { sourcePath, enabled: true },
      data: { hitCount: { increment: 1 }, lastHitAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
