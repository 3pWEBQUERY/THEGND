import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type AppSession = { user?: { id?: string } }

export async function GET() {
  const session = (await getServerSession(authOptions as any)) as AppSession | null
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: Replace with real billing provider integration (e.g., Stripe) using session.user.id
  // Mock data for UI development
  const mock = {
    subscription: {
      status: 'none',
      planName: undefined,
      amount: undefined,
      currency: 'EUR',
      currentPeriodEnd: null,
      cancelAt: null,
    },
    paymentMethods: [] as Array<{
      id: string
      brand: string
      last4: string
      expMonth: number
      expYear: number
      isDefault?: boolean
    }>,
    invoices: [] as Array<{
      id: string
      amount: number
      currency: string
      status: string
      date: string
      hostedInvoiceUrl?: string
      pdf?: string
    }>,
  }

  return NextResponse.json(mock)
}
