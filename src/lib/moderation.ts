import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isEmailAdmin } from '@/lib/admin'

export async function requireModerator() {
  const session = await getServerSession(authOptions as any)
  const email = (session as any)?.user?.email as string | undefined
  const userId = (session as any)?.user?.id as string | undefined
  if (!userId) return { isModerator: false, session }
  if (email && isEmailAdmin(email)) return { isModerator: true, session }
  try {
    const u = await prisma.user.findUnique({ where: { id: userId } })
    return { isModerator: !!(u as any)?.isModerator, session }
  } catch {
    return { isModerator: false, session }
  }
}
