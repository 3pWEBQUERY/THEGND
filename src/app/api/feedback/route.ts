import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as any
    const form = await request.formData()
    const message = String(form.get('message') || '').trim()
    const emailRaw = String(form.get('email') || '').trim()
    const reasonRaw = String(form.get('reason') || '').trim().toUpperCase()
    const customTitle = String(form.get('customTitle') || '').trim() || null
    const contact = String(form.get('contact') || '').trim() || null

    if (!message) {
      return NextResponse.json({ error: 'message_required' }, { status: 400 })
    }

    const reason = ['REPORT_AD','BUG','PRAISE','ADVERTISING','CUSTOMER_SERVICE','OTHER'].includes(reasonRaw) ? (reasonRaw as any) : null

    await prisma.feedback.create({
      data: ({
        message,
        email: session?.user?.email ?? (emailRaw || null),
        userId: session?.user?.id ?? null,
        reason,
        customTitle,
        contact,
      }) as any,
    })

    // Redirect back to /feedback with success flag
    const url = new URL('/feedback?success=1', request.url)
    return NextResponse.redirect(url)
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
