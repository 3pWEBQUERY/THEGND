/**
 * Community helper utilities for the Reddit-like community system
 */
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions as any)
  return (session as any)?.user?.id ?? null
}

export async function requireAuth(): Promise<string> {
  const userId = await getSessionUserId()
  if (!userId) throw new AuthError('Nicht autorisiert', 401)
  return userId
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/** Check if user is a member (any role) */
export async function getMembership(communityId: string, userId: string) {
  return prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
  })
}

/** Check if user is mod or owner */
export async function isModerator(communityId: string, userId: string): Promise<boolean> {
  const member = await getMembership(communityId, userId)
  return member?.role === 'MODERATOR' || member?.role === 'OWNER'
}

/** Check if user is owner */
export async function isOwner(communityId: string, userId: string): Promise<boolean> {
  const member = await getMembership(communityId, userId)
  return member?.role === 'OWNER'
}

/** Check if user is banned */
export async function isBanned(communityId: string, userId: string): Promise<boolean> {
  const ban = await prisma.communityBan.findUnique({
    where: { communityId_userId: { communityId, userId } },
  })
  if (!ban) return false
  if (ban.status === 'TEMPORARY' && ban.expiresAt && ban.expiresAt < new Date()) {
    // Expired temp ban — remove it
    await prisma.communityBan.delete({ where: { id: ban.id } }).catch(() => {})
    return false
  }
  return true
}

/** Check if user is a global admin */
export async function isGlobalAdmin(userId: string): Promise<boolean> {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  if (!adminEmails.length) return false
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  return user ? adminEmails.includes(user.email.toLowerCase()) : false
}

/** Hot ranking algorithm (simplified Reddit-style) */
export function hotScore(score: number, createdAt: Date): number {
  const order = Math.log10(Math.max(Math.abs(score), 1))
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0
  const seconds = (createdAt.getTime() - new Date('2025-01-01').getTime()) / 1000
  return sign * order + seconds / 45000
}

/** Log a mod action */
export async function logModAction(params: {
  communityId: string
  moderatorId: string
  action: string
  targetUserId?: string
  targetPostId?: string
  targetCommentId?: string
  reason?: string
  metadata?: Record<string, any>
}) {
  return prisma.communityModLog.create({
    data: {
      communityId: params.communityId,
      moderatorId: params.moderatorId,
      action: params.action as any,
      targetUserId: params.targetUserId,
      targetPostId: params.targetPostId,
      targetCommentId: params.targetCommentId,
      reason: params.reason,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    },
  })
}
