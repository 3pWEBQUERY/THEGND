import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Self settings for the logged-in user (ESCORT config)
export async function GET() {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const key = `dates:settings:${session.user.id}`
    const row = await (prisma as any).appSetting.findUnique({ where: { key } })
    const settings = (() => { try { return row?.value ? JSON.parse(row.value) : null } catch { return null } })()
    return NextResponse.json({ settings: settings || { availabilityNote: '', currency: 'EUR', durations: [], extras: [], places: [] } })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const settings = body?.settings
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings' }, { status: 400 })
    }
    const key = `dates:settings:${session.user.id}`
    await (prisma as any).appSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(settings) },
      create: { key, value: JSON.stringify(settings) },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
