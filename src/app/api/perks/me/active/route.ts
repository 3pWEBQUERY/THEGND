import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isPerkActive } from '@/lib/perks'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const perk = String(searchParams.get('perk') || '')
    const days = Math.max(1, Math.min(90, parseInt(String(searchParams.get('days') || '30'), 10) || 30))
    if (!perk) return NextResponse.json({ error: 'perk erforderlich' }, { status: 400 })

    const active = await isPerkActive(session.user.id, perk, days)
    return NextResponse.json({ active })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}
