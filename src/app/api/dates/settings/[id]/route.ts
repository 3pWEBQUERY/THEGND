import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const key = `dates:settings:${id}`
    const row = await (prisma as any).appSetting.findUnique({ where: { key } })
    const settings = (() => { try { return row?.value ? JSON.parse(row.value) : null } catch { return null } })()
    return NextResponse.json({ settings: settings || { availabilityNote: '', currency: 'EUR', durations: [], extras: [], places: [], outfits: [] } })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
