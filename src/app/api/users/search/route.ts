import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const userType = url.searchParams.get('userType')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    const whereClause: any = {
      id: {
        not: session.user.id // Exclude current user
      },
      isActive: true
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        {
          email: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          profile: {
            displayName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // Add user type filter
    if (userType && userType !== 'ALL') {
      whereClause.userType = userType
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        profile: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true
          }
        }
      },
      take: limit,
      orderBy: [
        {
          profile: {
            displayName: 'asc'
          }
        },
        {
          email: 'asc'
        }
      ]
    })

    // Check which users the current user is following
    const userIds = users.map(user => user.id)
    const followingRelations = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
        followingId: {
          in: userIds
        }
      }
    })

    const followingSet = new Set(followingRelations.map(f => f.followingId))

    const usersWithFollowStatus = users.map(user => ({
      id: user.id,
      email: user.email,
      userType: user.userType,
      profile: user.profile,
      _count: user._count,
      isFollowing: followingSet.has(user.id)
    }))

    return NextResponse.json(usersWithFollowStatus)
  } catch (error) {
    console.error('Fehler beim Suchen von Benutzern:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}