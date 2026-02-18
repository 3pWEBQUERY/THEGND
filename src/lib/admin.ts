import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type AppSession = { user?: { id?: string; email?: string } } | null

export async function requireAdmin(): Promise<{ session: AppSession; isAdmin: boolean }> {
  const session = (await getServerSession(authOptions as any)) as AppSession
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  const email = session?.user?.email?.toLowerCase()
  const isAdmin = !!email && adminEmails.includes(email)
  return { session, isAdmin }
}

export function isEmailAdmin(email?: string | null) {
  if (!email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  return adminEmails.includes(email.toLowerCase())
}
