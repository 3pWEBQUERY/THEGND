import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isEmailAdmin } from '@/lib/admin'

export async function POST(req: NextRequest, { params }: { params: Promise<{ assetId: string }> }) {
  const session = (await getServerSession(authOptions as any)) as any
  const email = session?.user?.email as string | undefined
  if (!email || !isEmailAdmin(email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { assetId } = await params
  let body: any
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const action = body?.action as 'approve' | 'reject'
  const note = typeof body?.note === 'string' ? body.note : undefined
  if (!assetId || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const status = action === 'approve' ? 'APPROVED' : 'REJECTED'

  const updated = await (prisma as any).marketingAsset.update({
    where: { id: assetId },
    data: { status, reviewNote: note, reviewedAt: new Date() },
  })

  // Optionally, update parent order status if needed (e.g., when all assets are reviewed)
  // Not implemented here to keep logic simple.

  return NextResponse.json({ ok: true, asset: updated })
}
