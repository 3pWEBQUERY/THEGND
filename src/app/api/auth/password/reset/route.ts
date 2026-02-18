import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email, token, password, passwordConfirm } = await request.json()

    const normEmail = String(email || '').trim().toLowerCase()
    const rawToken = String(token || '')
    const newPassword = String(password || '')
    const newPasswordConfirm = String(passwordConfirm || '')

    if (!normEmail || !rawToken || !newPassword || !newPasswordConfirm) {
      return NextResponse.json({ error: 'Bitte alle Felder ausfüllen' }, { status: 400 })
    }
    if (newPassword !== newPasswordConfirm) {
      return NextResponse.json({ error: 'Passwörter stimmen nicht überein' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen lang sein' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: normEmail }, select: { id: true } })
    if (!user) {
      // Do not reveal existence; pretend success
      return NextResponse.json({ message: 'Passwort wurde aktualisiert' }, { status: 200 })
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

    // Find a valid token (raw SQL to avoid Prisma model coupling)
    const now = new Date()
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM public.password_reset_tokens
      WHERE user_id = ${user.id}
        AND token_hash = ${tokenHash}
        AND expires_at > ${now}
        AND used_at IS NULL
      LIMIT 1
    `
    const prt = rows && rows.length > 0 ? rows[0] : null

    if (!prt) {
      return NextResponse.json({ error: 'Ungültiger oder abgelaufener Token' }, { status: 400 })
    }

    // Update password and mark token used (transaction)
    const hash = await bcrypt.hash(newPassword, 12)
    await prisma.$transaction([
      prisma.$executeRaw`UPDATE public.users SET password = ${hash} WHERE id = ${user.id}`,
      prisma.$executeRaw`UPDATE public.password_reset_tokens SET used_at = ${now} WHERE id = ${prt.id}`,
      prisma.$executeRaw`DELETE FROM public.password_reset_tokens WHERE user_id = ${user.id} AND id <> ${prt.id}`,
    ])

    return NextResponse.json({ message: 'Passwort wurde aktualisiert' }, { status: 200 })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json({ error: 'Server Fehler' }, { status: 500 })
  }
}
