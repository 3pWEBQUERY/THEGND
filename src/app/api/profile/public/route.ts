import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })
    }

    // Load user with profile and selected relations similar to private profile API
    const initialUser = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        posts: { take: 10, orderBy: { createdAt: 'desc' }, include: { likes: true, comments: { select: { id: true, content: true, parentId: true, createdAt: true, author: { select: { id: true, email: true, profile: { select: { displayName: true, avatar: true } } } } } } } },
        followers: { include: { follower: { select: { id: true, email: true, userType: true, profile: { select: { displayName: true, avatar: true } } } } } },
        following: { include: { following: { select: { id: true, email: true, userType: true, profile: { select: { displayName: true, avatar: true } } } } } },
        stories: { where: { expiresAt: { gt: new Date() }, isActive: true }, orderBy: { createdAt: 'desc' } },
      },
    })

    if (!initialUser) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    let user = initialUser

    // Auto-create empty profile for MEMBERS if missing
    if (!user.profile && user.userType === 'MEMBER') {
      try {
        await prisma.profile.create({ data: { userId: user.id, displayName: user.email.split('@')[0] } })
        // Reload minimal to include profile
        const reloaded = await prisma.user.findUnique({ where: { id: user.id }, include: { profile: true } })
        if (reloaded) user = { ...user, profile: reloaded.profile } as any
      } catch {}
    }

    // Parse JSON fields if they exist
    if (user.profile) {
      try { (user.profile as any).languages = user.profile.languages ? JSON.parse(user.profile.languages) : [] } catch { (user.profile as any).languages = [] }
      try { (user.profile as any).gallery = user.profile.gallery ? JSON.parse(user.profile.gallery) : [] } catch { (user.profile as any).gallery = [] }
      try { (user.profile as any).media = (user.profile as any).media ? JSON.parse((user.profile as any).media) : [] } catch { (user.profile as any).media = [] }
      try { (user.profile as any).services = user.profile.services ? JSON.parse(user.profile.services) : [] } catch { (user.profile as any).services = [] }
      try { (user.profile as any).socialMedia = user.profile.socialMedia ? JSON.parse(user.profile.socialMedia) : {} } catch { (user.profile as any).socialMedia = {} }
      try { (user.profile as any).preferences = user.profile.preferences ? JSON.parse(user.profile.preferences) : {} } catch { (user.profile as any).preferences = {} }
    }

    const { password, ...userWithoutPassword } = user as any
    return NextResponse.json({ user: userWithoutPassword }, { status: 200 })
  } catch (error) {
    console.error('Public profile fetch error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Laden des öffentlichen Profils' }, { status: 500 })
  }
}
