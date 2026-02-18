import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type AppSession = { user?: { id?: string } }

export async function POST() {
  const session = (await getServerSession(authOptions as any)) as AppSession | null
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: Implement real billing portal session creation (e.g., Stripe Billing Portal)
  // Example (future): create a portal session and return { url }
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
