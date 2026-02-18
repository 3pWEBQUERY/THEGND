import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { id } = await params
  try {
    const payload = await req.json()
    const data: any = {}
    if (typeof payload.email === 'string') data.email = payload.email
    if (typeof payload.userType === 'string') data.userType = payload.userType
    if (typeof payload.isActive === 'boolean') data.isActive = payload.isActive
    if (typeof payload.password === 'string' && payload.password.length > 0) {
      data.password = await bcrypt.hash(payload.password, 10)
    }
    const user = await prisma.user.update({ where: { id }, data })
    return NextResponse.json({ ok: true, user })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Fehler' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

  const { id } = await params
  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Fehler' }, { status: 500 })
  }
}
