import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// We store per-org availability map in appSetting with key girls:org:<orgId>:presence
// Value is a JSON object: { [escortId: string]: boolean }

export async function GET(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)
    const uid = session?.user?.id as string | undefined
    const userType = session?.user?.userType as string | undefined
    if (!uid) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    if (!['AGENCY','CLUB','STUDIO'].includes(userType || '')) return NextResponse.json({ error: 'Nur für Agenturen/Clubs/Studios' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const idsParam = searchParams.get('ids')
    const ids = idsParam ? idsParam.split(',').map(s => s.trim()).filter(Boolean) : []

    const setting = await (prisma as any).appSetting.findUnique({ where: { key: `girls:org:${uid}:presence` } })
    const map = (() => { try { return setting?.value ? JSON.parse(setting.value) : {} } catch { return {} } })() as Record<string, boolean>

    if (!ids || ids.length === 0) return NextResponse.json(map)

    const filtered: Record<string, boolean> = {}
    for (const id of ids) {
      if (Object.prototype.hasOwnProperty.call(map, id)) filtered[id] = !!map[id]
    }
    return NextResponse.json(filtered)
  } catch (e) {
    console.error('GET /api/girls/presence error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)
    const uid = session?.user?.id as string | undefined
    const userType = session?.user?.userType as string | undefined
    if (!uid) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    if (!['AGENCY','CLUB','STUDIO'].includes(userType || '')) return NextResponse.json({ error: 'Nur für Agenturen/Clubs/Studios' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const escortId = typeof body?.id === 'string' ? body.id : ''
    const available = Boolean(body?.available)
    if (!escortId) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })

    // Verify the escort is connected to this org
    const membersSetting = await (prisma as any).appSetting.findUnique({ where: { key: `girls:org:${uid}:members` } })
    const ids: string[] = (() => { try { return membersSetting?.value ? JSON.parse(membersSetting.value) : [] } catch { return [] } })()
    if (!ids.includes(escortId)) return NextResponse.json({ error: 'Nicht verbunden' }, { status: 403 })

    const presenceKey = `girls:org:${uid}:presence`
    const existing = await (prisma as any).appSetting.findUnique({ where: { key: presenceKey } })
    const map = (() => { try { return existing?.value ? JSON.parse(existing.value) : {} } catch { return {} } })() as Record<string, boolean>
    map[escortId] = available

    if (existing) {
      await (prisma as any).appSetting.update({ where: { key: presenceKey }, data: { value: JSON.stringify(map) } })
    } else {
      await (prisma as any).appSetting.create({ data: { key: presenceKey, value: JSON.stringify(map) } })
    }

    return NextResponse.json({ ok: true, id: escortId, available })
  } catch (e) {
    console.error('POST /api/girls/presence error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
