import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function POST(req: NextRequest) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  try {
    const body = await req.json()
    const { email, password, userType } = body || {}
    if (!email || !password || !userType) {
      return NextResponse.json({ error: 'email, password, userType erforderlich' }, { status: 400 })
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, password: hashed, userType },
      select: { id: true, email: true }
    })
    return NextResponse.json({ ok: true, user })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Fehler' }, { status: 500 })
  }
}
