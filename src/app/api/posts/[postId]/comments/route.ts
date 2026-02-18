import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/posts/[postId]/comments - fetch comments thread (top-level + replies)
export async function GET(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params

    // Validate post exists (optional but helpful for 404)
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } })
    if (!post) {
      return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })
    }

    let comments: any[] = []
    try {
      // Preferred (threaded) query – requires new Prisma Client after migration
      comments = await prisma.comment.findMany({
        where: { postId, parentId: null as any },
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              profile: { select: { displayName: true, avatar: true } },
            },
          },
          children: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: {
                  id: true,
                  email: true,
                  profile: { select: { displayName: true, avatar: true } },
                },
              },
            },
          },
        },
      })
    } catch (e: any) {
      // Temporary fallback for when the running dev server hasn't reloaded Prisma Client yet
      console.warn('[comments] Falling back to flat comments (no threads):', e?.message)
      comments = await prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              profile: { select: { displayName: true, avatar: true } },
            },
          },
        },
      })
    }

    return NextResponse.json({ comments }, { status: 200 })
  } catch (error) {
    console.error('Comments fetch error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Laden der Kommentare' }, { status: 500 })
  }
}

// POST /api/posts/[postId]/comments - create comment or reply (parentId optional)
export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { postId } = await params

    const body = await request.json()
    const content = (body?.content || '').trim()
    const parentId = body?.parentId ? String(body.parentId) : null

    if (!content) {
      return NextResponse.json({ error: 'Inhalt erforderlich' }, { status: 400 })
    }

    // Ensure post exists
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } })
    if (!post) {
      return NextResponse.json({ error: 'Post nicht gefunden' }, { status: 404 })
    }

    // If replying, ensure parent exists and belongs to this post
    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { id: true, postId: true } })
      if (!parent || parent.postId !== postId) {
        return NextResponse.json({ error: 'Ungültiger übergeordneter Kommentar' }, { status: 400 })
      }
    }

    let created
    try {
      created = await prisma.comment.create({
        data: {
          content,
          postId,
          authorId: session.user.id,
          // parentId is supported after migration; if client is stale it'll throw and we'll fallback below
          parentId: parentId || undefined,
        },
        include: {
          author: {
            select: {
              email: true,
              profile: { select: { displayName: true, avatar: true } },
            },
          },
        },
      })
    } catch (e: any) {
      if (parentId) {
        // Fallback for stale Prisma Client: create as top-level comment
        console.warn('[comments] Creating reply as top-level due to stale Prisma Client:', e?.message)
        created = await prisma.comment.create({
          data: {
            content,
            postId,
            authorId: session.user.id,
          },
          include: {
            author: {
              select: {
                email: true,
                profile: { select: { displayName: true, avatar: true } },
              },
            },
          },
        })
      } else {
        throw e
      }
    }

    // Return new total comments count for this post
    const commentsCount = await prisma.comment.count({ where: { postId } })

    return NextResponse.json({ message: 'Kommentar erstellt', comment: created, commentsCount }, { status: 201 })
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json({ error: 'Server Fehler beim Erstellen des Kommentars' }, { status: 500 })
  }
}
