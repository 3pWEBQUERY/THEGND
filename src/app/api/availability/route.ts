import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Stores per-escort availability in AppSetting under key escort:availability:<userId>
// JSON value: { available: boolean, updatedAt: string }

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions as any)
    const uid = session?.user?.id as string | undefined
    const userType = session?.user?.userType as string | undefined
    if (!uid) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    if (userType !== 'ESCORT') return NextResponse.json({ error: 'Nur für Escorts' }, { status: 403 })

    const key = `escort:availability:${uid}`
    const setting = await (prisma as any).appSetting.findUnique({ where: { key } })
    const data = (() => { try { return setting?.value ? JSON.parse(setting.value) : {} } catch { return {} } })()
    return NextResponse.json({ available: !!data.available, updatedAt: data.updatedAt || null })
  } catch (e) {
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)
    const uid = session?.user?.id as string | undefined
    const userType = session?.user?.userType as string | undefined
    if (!uid) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    if (userType !== 'ESCORT') return NextResponse.json({ error: 'Nur für Escorts' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    if (typeof body?.available !== 'boolean') return NextResponse.json({ error: 'available (boolean) erforderlich' }, { status: 400 })

    const key = `escort:availability:${uid}`
    const payload = { available: !!body.available, updatedAt: new Date().toISOString() }
    const existing = await (prisma as any).appSetting.findUnique({ where: { key } })
    if (existing) {
      await (prisma as any).appSetting.update({ where: { key }, data: { value: JSON.stringify(payload) } })
    } else {
      await (prisma as any).appSetting.create({ data: { key, value: JSON.stringify(payload) } })
    }
    return NextResponse.json(payload)
  } catch (e) {
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
