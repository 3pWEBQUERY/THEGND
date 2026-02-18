import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const session = await getServerSession(authOptions as any)
    const userId = (session as any)?.user?.id as string | undefined
    if (!userId) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { postId } = await params
    const body = await req.json().catch(() => ({})) as { reason?: string }
    const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 500) : null

    // Persist lightweight report via Feedback model (no extra schema needed)
    await prisma.feedback.create({
      data: ({
        userId,
        email: (session as any)?.user?.email || null,
        reason: 'OTHER' as any,
        customTitle: `FEED-POST MELDEN: ${postId}`,
        message: `Meldung für Feed-Post ${postId}${reason ? `\nGrund: ${reason}` : ''}`,
        contact: null,
      }) as any,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}
