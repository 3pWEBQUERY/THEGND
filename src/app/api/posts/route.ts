import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPostSchema } from '@/lib/validations'
import { awardEvent } from '@/lib/gamification'

// GET - Fetch posts for newsfeed
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get posts from users the current user follows + own posts
    const followingIds = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true }
    })

    const userIds = [session.user.id, ...followingIds.map(f => f.followingId)]

    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: userIds },
        isActive: true
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            userType: true,
            profile: {
              select: {
                displayName: true,
                avatar: true
              }
            }
          }
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    displayName: true,
                    avatar: true
                  }
                }
              }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    displayName: true,
                    avatar: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    // Parse images JSON if exists
    const postsWithParsedData = posts.map(post => ({
      ...post,
      images: post.images ? JSON.parse(post.images) : [],
      isLikedByUser: post.likes.some(like => like.user.id === session.user.id)
    }))

    return NextResponse.json(
      { posts: postsWithParsedData },
      { status: 200 }
    )
  } catch (error) {
    console.error('Posts fetch error:', error)
    return NextResponse.json(
      { error: 'Server Fehler beim Laden der Posts' },
      { status: 500 }
    )
  }
}

// POST - Create new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const raw = await request.json()
    const validatedData = createPostSchema.parse(raw)
    const safeContent = (validatedData.content ?? '').trim()
    const groupId: string | undefined = typeof (raw as any)?.groupId === 'string' && (raw as any).groupId ? (raw as any).groupId : undefined

    // If posting to a group, check group exists and membership if private
    if (groupId) {
      const group = await (prisma as any).feedGroup.findUnique({ where: { id: groupId } })
      if (!group) {
        return NextResponse.json({ error: 'Gruppe nicht gefunden' }, { status: 404 })
      }
      if (group.privacy === 'PRIVATE') {
        const isMember = await (prisma as any).feedGroupMember.findUnique({ where: { groupId_userId: { groupId, userId: session.user.id } } })
        if (!isMember) {
          return NextResponse.json({ error: 'Kein Zugriff auf private Gruppe' }, { status: 403 })
        }
      }
    }

    const post = await prisma.post.create({
      data: {
        content: safeContent,
        images: validatedData.images ? JSON.stringify(validatedData.images) : null,
        authorId: session.user.id,
        ...(groupId ? { groupId } : {} as any),
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            userType: true,
            profile: {
              select: {
                displayName: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    })

    // Parse images for response
    const postWithParsedData = {
      ...post,
      images: post.images ? JSON.parse(post.images) : [],
      isLikedByUser: false,
      likes: [],
      comments: []
    }

    // Gamification: award points for creating a feed post
    try {
      await awardEvent(session.user.id, 'FEED_POST' as any, 20, { postId: post.id })
    } catch (e) {
      // do not block post creation on gamification failure
    }

    return NextResponse.json(
      { 
        message: 'Post erfolgreich erstellt',
        post: postWithParsedData 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Post creation error:', error)
    return NextResponse.json(
      { error: 'Server Fehler beim Erstellen des Posts' },
      { status: 500 }
    )
  }
}