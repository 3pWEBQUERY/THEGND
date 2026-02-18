import { prisma } from '@/lib/prisma'

// Returns true if the user has claimed the given perk within the last `days` days
export async function isPerkActive(userId: string, perkKey: string, days: number): Promise<boolean> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const up = await (prisma as any).userPerk.findFirst({
    where: {
      userId,
      perk: { key: perkKey },
      claimedAt: { gt: since },
    },
  })
  return !!up
}

// Returns a Set of userIds from the provided list who have the given perk active in the last `days` days
export async function getActivePerkUsers(userIds: string[], perkKey: string, days: number): Promise<Set<string>> {
  if (!userIds || userIds.length === 0) return new Set()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const rows: Array<{ userId: string }> = await (prisma as any).userPerk.findMany({
    where: {
      userId: { in: Array.from(new Set(userIds)) },
      perk: { key: perkKey },
      claimedAt: { gt: since },
    },
    select: { userId: true },
  })
  return new Set(rows.map(r => r.userId))
}
