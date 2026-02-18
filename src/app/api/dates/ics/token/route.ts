import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session: any = await getServerSession(authOptions as any)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const key = `dates:icsToken:${session.user.id}`
  try {
    const row = await (prisma as any).appSetting.findUnique({ where: { key } })
    const token = row?.value || null
    return NextResponse.json({ token })
  } catch {
    return NextResponse.json({ token: null })
  }
}

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions as any)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const key = `dates:icsToken:${session.user.id}`
  const token = (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)
  try {
    await (prisma as any).appSetting.upsert({
      where: { key },
      update: { value: token },
      create: { key, value: token },
    })
    return NextResponse.json({ token })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
