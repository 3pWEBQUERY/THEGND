import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let payload: any = {}

    if (contentType.includes('application/json')) {
      payload = await req.json()
    } else if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      payload = Object.fromEntries(form.entries())
      // Convert File objects to null since we expect URLs in JSON flow
      if (payload.idPhoto instanceof File) payload.idPhoto = null
      if (payload.selfiePhoto instanceof File) payload.selfiePhoto = null
      if (payload.idVideo instanceof File) payload.idVideo = null
    }

    const firstName = String(payload.firstName || '')
    const lastName = String(payload.lastName || '')
    const birthDate = String(payload.birthDate || '')
    const idNumber = String(payload.idNumber || '')
    const idPhotoUrl = typeof payload.idPhotoUrl === 'string' ? payload.idPhotoUrl : null
    const selfiePhotoUrl = typeof payload.selfiePhotoUrl === 'string' ? payload.selfiePhotoUrl : null
    const idVideoUrl = typeof payload.idVideoUrl === 'string' ? payload.idVideoUrl : null

    if (!firstName || !lastName || !birthDate || !idNumber || !idPhotoUrl || !selfiePhotoUrl) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const session = (await getServerSession(authOptions as any)) as any
    const userId = session?.user?.id as string | undefined
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    let createdId: string | null = null
    const hasDelegate = typeof (prisma as any).verificationRequest?.create === 'function'
    if (hasDelegate) {
      const record = await (prisma as any).verificationRequest.create({
        data: {
          userId,
          firstName,
          lastName,
          birthDate: new Date(birthDate),
          idNumber,
          idPhotoUrl,
          selfiePhotoUrl,
          idVideoUrl: idVideoUrl || null,
          status: 'PENDING',
        },
      })
      createdId = record.id as string
    } else {
      const rows = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO "verification_requests" ("userId","firstName","lastName","birthDate","idNumber","idPhotoUrl","selfiePhotoUrl","idVideoUrl","status")
        VALUES (${userId}, ${firstName}, ${lastName}, ${new Date(birthDate)}, ${idNumber}, ${idPhotoUrl}, ${selfiePhotoUrl}, ${idVideoUrl || null}, ${Prisma.sql`'PENDING'::"VerificationStatus"`})
        RETURNING id;
      `
      createdId = rows?.[0]?.id || null
    }

    return NextResponse.json({ ok: true, id: createdId })
  } catch (e) {
    console.error('verify_api_error', e)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
