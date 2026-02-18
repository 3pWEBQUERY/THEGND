import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isEmailAdmin } from '@/lib/admin'

type AppSession = { user?: { id?: string } }

// Simple in-memory rate limiter (per user, 5 req/min)
const WINDOW_MS = 60_000
const MAX_REQ = 5
const userHits = new Map<string, number[]>()

function rateLimit(key: string) {
  const now = Date.now()
  const arr = (userHits.get(key) || []).filter((ts) => now - ts < WINDOW_MS)
  if (arr.length >= MAX_REQ) {
    userHits.set(key, arr)
    return false
  }
  arr.push(now)
  userHits.set(key, arr)
  return true
}

export async function GET() {
  try {
    const session = (await getServerSession(authOptions as any)) as AppSession | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    if (!rateLimit(session.user.id)) {
      return NextResponse.json({ error: 'Zu viele Anfragen. Bitte später erneut versuchen.' }, { status: 429 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, createdAt: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({ email: user.email, createdAt: user.createdAt, isAdmin: isEmailAdmin(user.email) }, { status: 200 })
  } catch (error) {
    console.error('Account GET error:', error)
    return NextResponse.json({ error: 'Server Fehler' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as AppSession | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    if (!rateLimit(session.user.id)) {
      return NextResponse.json({ error: 'Zu viele Anfragen. Bitte später erneut versuchen.' }, { status: 429 })
    }

    const body = await request.json()
    const { email, password, passwordConfirm, currentPassword } = body as {
      email?: string
      password?: string
      passwordConfirm?: string
      currentPassword?: string
    }

    const updates: { email?: string; password?: string } = {}

    // Email update
    if (typeof email === 'string') {
      const newEmail = email.trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 })
      }
      // Check if taken by another user
      const existing = await prisma.user.findUnique({ where: { email: newEmail } })
      if (existing && existing.id !== session.user.id) {
        return NextResponse.json({ error: 'E-Mail bereits vergeben' }, { status: 409 })
      }
      updates.email = newEmail
    }

    // Password update (requires currentPassword)
    if (password || passwordConfirm) {
      if (!password || !passwordConfirm) {
        return NextResponse.json({ error: 'Bitte Passwort und Bestätigung angeben' }, { status: 400 })
      }
      if (password !== passwordConfirm) {
        return NextResponse.json({ error: 'Passwörter stimmen nicht überein' }, { status: 400 })
      }
      if (password.length < 8) {
        return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen lang sein' }, { status: 400 })
      }
      if (!currentPassword) {
        return NextResponse.json({ error: 'Aktuelles Passwort erforderlich' }, { status: 400 })
      }
      const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true } })
      if (!dbUser) {
        return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
      }
      const ok = await bcrypt.compare(currentPassword, dbUser.password)
      if (!ok) {
        return NextResponse.json({ error: 'Aktuelles Passwort ist falsch' }, { status: 400 })
      }
      const hash = await bcrypt.hash(password, 10)
      updates.password = hash
    }

    if (!updates.email && !updates.password) {
      return NextResponse.json({ error: 'Keine Änderungen übermittelt' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
      select: { id: true, email: true }
    })

    return NextResponse.json({ message: 'Konto aktualisiert', user: updated }, { status: 200 })
  } catch (error) {
    console.error('Account PUT error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Aktualisieren' }, { status: 500 })
  }
}
