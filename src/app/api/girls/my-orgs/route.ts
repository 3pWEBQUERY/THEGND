import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions as any)
    const uid = session?.user?.id as string | undefined
    const userType = session?.user?.userType as string | undefined
    if (!uid) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    if (userType !== 'ESCORT') return NextResponse.json({ error: 'Nur für Escorts' }, { status: 403 })

    const escortKey = `girls:escort:${uid}:orgs`
    const escortSetting = await (prisma as any).appSetting.findUnique({ where: { key: escortKey } })
    const orgIds: string[] = (() => { try { return escortSetting?.value ? JSON.parse(escortSetting.value) : [] } catch { return [] } })()

    if (!orgIds || orgIds.length === 0) return NextResponse.json({ items: [] })

    const orgs = await (prisma as any).user.findMany({
      where: { id: { in: orgIds }, isActive: true, userType: { in: ['AGENCY','CLUB','STUDIO'] } },
      include: { profile: true },
    })

    const items = orgs.map((o: any) => ({
      id: o.id,
      userType: o.userType,
      name: o.profile?.companyName || o.profile?.displayName || o.email,
      avatar: o.profile?.avatar || null,
      city: o.profile?.city || null,
      country: o.profile?.country || null,
    }))

    return NextResponse.json({ items })
  } catch (e) {
    console.error('GET /api/girls/my-orgs error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session: any = await getServerSession(authOptions as any)
    const uid = session?.user?.id as string | undefined
    const userType = session?.user?.userType as string | undefined
    if (!uid) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    if (userType !== 'ESCORT') return NextResponse.json({ error: 'Nur für Escorts' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const orgId = (body?.orgId || '').toString().trim()
    if (!orgId) return NextResponse.json({ error: 'orgId fehlt' }, { status: 400 })

    // Validate org
    const org = await (prisma as any).user.findUnique({ where: { id: orgId }, select: { id: true, userType: true } })
    if (!org || !['AGENCY','CLUB','STUDIO'].includes(org.userType)) return NextResponse.json({ error: 'Organisation ungültig' }, { status: 400 })

    // Escort side
    const escortKey = `girls:escort:${uid}:orgs`
    const escortSetting = await (prisma as any).appSetting.findUnique({ where: { key: escortKey } })
    const orgs: string[] = (() => { try { return escortSetting?.value ? JSON.parse(escortSetting.value) : [] } catch { return [] } })()

    // Org side
    const membersKey = `girls:org:${orgId}:members`
    const membersSetting = await (prisma as any).appSetting.findUnique({ where: { key: membersKey } })
    const members: string[] = (() => { try { return membersSetting?.value ? JSON.parse(membersSetting.value) : [] } catch { return [] } })()

    const nextOrgs = orgs.filter((x) => x !== orgId)
    const nextMembers = members.filter((x) => x !== uid)

    // Persist updates
    if (escortSetting) {
      await (prisma as any).appSetting.update({ where: { key: escortKey }, data: { value: JSON.stringify(nextOrgs) } })
    } else {
      await (prisma as any).appSetting.create({ data: { key: escortKey, value: JSON.stringify(nextOrgs) } })
    }
    if (membersSetting) {
      await (prisma as any).appSetting.update({ where: { key: membersKey }, data: { value: JSON.stringify(nextMembers) } })
    } else {
      await (prisma as any).appSetting.create({ data: { key: membersKey, value: JSON.stringify(nextMembers) } })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/girls/my-orgs error:', e)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
