import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { Resend } from 'resend'
import { buildPasswordResetEmailHtml, buildPasswordResetEmailText } from '@/lib/emailTemplates'

const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY as string) : null

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    const normEmail = String(email || '').trim().toLowerCase()

    if (!normEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail)) {
      return NextResponse.json({ error: 'Bitte E-Mail-Adresse angeben' }, { status: 400 })
    }

    // Find user (do not reveal existence)
    const user = await prisma.user.findUnique({ where: { email: normEmail }, select: { id: true, email: true, profile: { select: { displayName: true } } } })

    // Always respond success to avoid enumeration, but only proceed if user exists
    if (!user) {
      return NextResponse.json({ message: 'Wenn ein Konto existiert, wurde eine E-Mail gesendet.' }, { status: 200 })
    }

    // Ensure table/extension exist (safe no-op if already present)
    try { await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pgcrypto;` } catch {}
    try { await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
      id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      token_hash text NOT NULL UNIQUE,
      expires_at timestamp NOT NULL,
      used_at timestamp NULL,
      created_at timestamp NOT NULL DEFAULT now()
    );` } catch {}
    try { await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_expiry ON public.password_reset_tokens (user_id, expires_at);` } catch {}

    // Invalidate previous tokens for this user (optional cleanup)
    try { await prisma.$executeRaw`DELETE FROM public.password_reset_tokens WHERE user_id = ${user.id}` } catch {}

    // Create token values
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Insert token row
    try {
      await prisma.$executeRaw`INSERT INTO public.password_reset_tokens (user_id, token_hash, expires_at) VALUES (${user.id}, ${tokenHash}, ${expiresAt})`
    } catch (e) {
      console.error('Token insert failed:', e)
      // Still return generic success to avoid user enumeration
      return NextResponse.json({ message: 'Wenn ein Konto existiert, wurde eine E-Mail gesendet.' }, { status: 200 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thegnd.net'
    const resetUrl = `${appUrl.replace(/\/$/, '')}/auth/reset?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(user.email)}`

    // Load optional app settings for mail overrides
    let settings: any = null
    try {
      const s = await prisma.appSetting.findUnique({ where: { key: 'mail_settings' } })
      settings = s?.value ? JSON.parse(s.value) : null
    } catch {}

    const from = (settings?.from as string) || process.env.RESEND_FROM || 'THEGND <noreply@thegnd.net>'
    const logoUrl = typeof settings?.logoUrl === 'string' && settings.logoUrl.trim().length > 0 ? settings.logoUrl : null

    if (resendClient) {
      try {
        const html = buildPasswordResetEmailHtml({ appUrl, resetUrl, displayName: user.profile?.displayName ?? null, logoUrl })
        const text = buildPasswordResetEmailText(appUrl, resetUrl, user.profile?.displayName ?? null)
        const subject = 'Passwort zurücksetzen'
        const { error } = await resendClient.emails.send({ from, to: [user.email], subject, html, text })
        if (error) throw error
      } catch (e) {
        // Swallow errors to avoid leaking user existence; but log server-side
        console.error('Resend send error (forgot):', e)
      }
    }

    return NextResponse.json({ message: 'Wenn ein Konto existiert, wurde eine E-Mail gesendet.' }, { status: 200 })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Server Fehler' }, { status: 500 })
  }
}
