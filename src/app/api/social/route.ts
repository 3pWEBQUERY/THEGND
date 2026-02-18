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
    const type = url.searchParams.get('type') // 'followers' or 'following'
    const userId = url.searchParams.get('userId') || session.user.id

    if (type === 'followers') {
      // Get users who follow the specified user
      const followers = await prisma.follow.findMany({
        where: {
          followingId: userId
        },
        include: {
          follower: {
            include: {
              profile: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      const followerData = followers.map(follow => ({
        id: follow.follower.id,
        email: follow.follower.email,
        userType: follow.follower.userType,
        profile: follow.follower.profile,
        followedAt: follow.createdAt
      }))

      return NextResponse.json({
        type: 'followers',
        users: followerData,
        count: followerData.length
      })
    }

    if (type === 'following') {
      // Get users that the specified user follows
      const following = await prisma.follow.findMany({
        where: {
          followerId: userId
        },
        include: {
          following: {
            include: {
              profile: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      const followingData = following.map(follow => ({
        id: follow.following.id,
        email: follow.following.email,
        userType: follow.following.userType,
        profile: follow.following.profile,
        followedAt: follow.createdAt
      }))

      return NextResponse.json({
        type: 'following',
        users: followingData,
        count: followingData.length
      })
    }

    // Get both followers and following counts
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({
        where: { followingId: userId }
      }),
      prisma.follow.count({
        where: { followerId: userId }
      })
    ])

    // Check if current user follows the target user
    let isFollowing = false
    if (userId !== session.user.id) {
      const followRelation = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: userId
          }
        }
      })
      isFollowing = !!followRelation
    }

    return NextResponse.json({
      followersCount,
      followingCount,
      isFollowing
    })
  } catch (error) {
    console.error('Fehler beim Laden der Follow-Daten:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}