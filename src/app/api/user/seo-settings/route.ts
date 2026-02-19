import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET  — Retrieve SEO addon settings for the current user
 * POST — Save SEO addon settings for the current user
 */

export async function GET() {
  const session = (await getServerSession(authOptions as any)) as any
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const state = await prisma.userAddonState.findUnique({
    where: { userId_key: { userId, key: 'SEO' } },
  })
  if (!state || !state.enabled) {
    return NextResponse.json({ enabled: false, settings: null })
  }
  let settings = null
  try { settings = state.settings ? JSON.parse(state.settings) : null } catch {}
  return NextResponse.json({ enabled: true, settings })
}

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Check that user has SEO addon enabled
  const state = await prisma.userAddonState.findUnique({
    where: { userId_key: { userId, key: 'SEO' } },
  })
  if (!state || !state.enabled) {
    return NextResponse.json({ error: 'SEO Addon nicht aktiv' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { metaTitle, metaDescription, metaKeywords, ogImageUrl } = body
    const settings = JSON.stringify({ metaTitle, metaDescription, metaKeywords, ogImageUrl })
    await prisma.userAddonState.update({
      where: { userId_key: { userId, key: 'SEO' } },
      data: { settings },
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 400 })
  }
}
