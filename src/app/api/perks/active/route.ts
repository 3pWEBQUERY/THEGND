import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getActivePerkUsers } from '@/lib/perks'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const perk = String(searchParams.get('perk') || '')
    const idsParam = String(searchParams.get('ids') || '')
    const days = Math.max(1, Math.min(90, parseInt(String(searchParams.get('days') || '30'), 10) || 30))
    if (!perk || !idsParam) return NextResponse.json({ error: 'perk und ids erforderlich' }, { status: 400 })

    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean)
    if (ids.length === 0) return NextResponse.json({ active: [] })

    const activeSet = await getActivePerkUsers(ids, perk, days)
    return NextResponse.json({ active: Array.from(activeSet) })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}
