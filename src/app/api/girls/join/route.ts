import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions as any)
    const uid = session?.user?.id as string | undefined
    const userType = session?.user?.userType as string | undefined
    if (!uid) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    if (userType !== 'ESCORT') return NextResponse.json({ error: 'Nur ESCORTS können Codes einlösen' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    let code = (body?.code || '').toString().trim().toUpperCase()
    if (!code || code.length < 4) return NextResponse.json({ error: 'Ungültiger Code' }, { status: 400 })

    const setting = await (prisma as any).appSetting.findUnique({ where: { key: `girls:code:${code}` } })
    if (!setting) return NextResponse.json({ error: 'Code nicht gefunden' }, { status: 404 })
    const payload = (() => { try { return JSON.parse(setting.value || '{}') } catch { return {} } })() as any
    if (!payload?.orgId) return NextResponse.json({ error: 'Ungültiger Code' }, { status: 400 })

    // validate org exists and type
    const org = await (prisma as any).user.findUnique({ where: { id: payload.orgId }, select: { id: true, userType: true } })
    if (!org || !['AGENCY','CLUB','STUDIO'].includes(org.userType)) return NextResponse.json({ error: 'Organisation ungültig' }, { status: 400 })

    // load current member list
    const membersSettingKey = `girls:org:${org.id}:members`
    const membersSetting = await (prisma as any).appSetting.findUnique({ where: { key: membersSettingKey } })
    const members: string[] = (() => { try { return membersSetting?.value ? JSON.parse(membersSetting.value) : [] } catch { return [] } })()

    if (!members.includes(uid)) {
      members.push(uid)
      if (membersSetting) {
        await (prisma as any).appSetting.update({ where: { key: membersSettingKey }, data: { value: JSON.stringify(members) } })
      } else {
        await (prisma as any).appSetting.create({ data: { key: membersSettingKey, value: JSON.stringify(members) } })
      }
    }

    // optional: track reverse link for escort
    const escortKey = `girls:escort:${uid}:orgs`
    const escortSetting = await (prisma as any).appSetting.findUnique({ where: { key: escortKey } })
    const orgs: string[] = (() => { try { return escortSetting?.value ? JSON.parse(escortSetting.value) : [] } catch { return [] } })()
    if (!orgs.includes(org.id)) {
      orgs.push(org.id)
      if (escortSetting) {
        await (prisma as any).appSetting.update({ where: { key: escortKey }, data: { value: JSON.stringify(orgs) } })
      } else {
        await (prisma as any).appSetting.create({ data: { key: escortKey, value: JSON.stringify(orgs) } })
      }
    }

    // optional: increase usedCount if present
    try {
      const usedCount = Number(payload.usedCount || 0) + 1
      const nextPayload = { ...payload, usedCount }
      await (prisma as any).appSetting.update({ where: { key: `girls:code:${code}` }, data: { value: JSON.stringify(nextPayload) } })
    } catch {}

    return NextResponse.json({ ok: true, orgId: org.id })
  } catch (e) {
    console.error('POST /api/girls/join error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
