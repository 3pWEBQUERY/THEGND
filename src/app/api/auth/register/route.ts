import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { UserType } from '@prisma/client'
import { buildWelcomeEmailHtml } from '@/lib/emailTemplates'
import { Resend } from 'resend'

const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY as string) : null

async function sendWelcomeEmail(toEmail: string, userType: string, displayName?: string | null) {
  if (!resendClient) return { sent: false, reason: 'missing_api_key' }

  // Load optional ACP configuration overrides
  let settings: any = null
  let templates: any = null
  try {
    const [s, t] = await Promise.all([
      prisma.appSetting.findUnique({ where: { key: 'mail_settings' } }),
      prisma.appSetting.findUnique({ where: { key: 'mail_templates' } }),
    ])
    settings = s?.value ? JSON.parse(s.value) : null
    templates = t?.value ? JSON.parse(t.value) : null
  } catch {}

  if (settings && settings.enabled === false) {
    return { sent: false, reason: 'disabled' }
  }

  const from = (settings?.from as string) || process.env.RESEND_FROM || 'THEGND <noreply@thegnd.net>'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thegnd.net'
  const defaultSubject = 'Willkommen bei THEGND'
  const logoUrl = typeof settings?.logoUrl === 'string' && settings.logoUrl.trim().length > 0 ? settings.logoUrl : null
  const defaultHtml = buildWelcomeEmailHtml({ appUrl, userType, displayName: displayName ?? null, logoUrl })
  const plainGreeting = displayName && displayName.trim().length > 1 ? `Hallo ${displayName.trim()},` : 'Hallo,'
  const typeSuffix = userType ? ` (${userType})` : ''
  const defaultText = [
    'Willkommen bei THEGND',
    '',
    `${plainGreeting}`,
    `Dein Account wurde erfolgreich angelegt${typeSuffix}.`,
    'Du kannst dich jetzt anmelden und mit dem Onboarding fortfahren.',
    '',
    `Jetzt anmelden: ${appUrl.replace(/\/$/, '')}/auth/signin`,
    '',
    'Wenn du diese Registrierung nicht vorgenommen hast, ignoriere bitte diese E-Mail.'
  ].join('\n')

  const tplWelcome = templates?.welcome || null
  const subject = (tplWelcome?.subject as string) || defaultSubject
  const html = (tplWelcome?.html as string) || defaultHtml
  const text = (tplWelcome?.text as string) || defaultText

  try {
    const { error } = await resendClient.emails.send({ from, to: [toEmail], subject, html, text })
    if (error) throw error
    return { sent: true }
  } catch (err) {
    console.error('Resend send error:', err)
    return { sent: false, reason: 'send_failed' }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, userType } = await request.json()
    const normEmail = String(email).trim().toLowerCase()

    // Validate input
    if (!email || !password || !userType) {
      return NextResponse.json(
        { error: 'Email, Password und User Type sind erforderlich' },
        { status: 400 }
      )
    }

    // Check if user already exists (select minimal fields to avoid schema drift issues)
    const existingUser = await prisma.user.findUnique({
      where: { email: normEmail },
      select: { id: true }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ein User mit dieser Email existiert bereits' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normEmail,
        password: hashedPassword,
        userType: userType as UserType,
        onboardingStatus: 'NOT_STARTED'
      },
      // Return only safe fields explicitly to avoid selecting columns that might not exist yet
      select: { id: true, email: true, userType: true, onboardingStatus: true }
    })

    // Try to send welcome email via Resend (non-blocking for user response)
    try {
      const localPart = user.email.split('@')[0] || ''
      const guessName = localPart
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim()
      await sendWelcomeEmail(user.email, String(user.userType), guessName || null)
    } catch {}

    return NextResponse.json(
      { 
        message: 'User erfolgreich registriert',
        user
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Server Fehler bei der Registrierung' },
      { status: 500 }
    )
  }
}