import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { postId } = await params

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post nicht gefunden' },
        { status: 404 }
      )
    }

    // Check if user already liked this post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId
        }
      }
    })

    let isLiked = false
    let likesCount = 0

    if (existingLike) {
      // Unlike the post
      await prisma.like.delete({
        where: { id: existingLike.id }
      })
      isLiked = false
    } else {
      // Like the post
      await prisma.like.create({
        data: {
          userId: session.user.id,
          postId: postId
        }
      })
      isLiked = true
    }

    // Get updated likes count
    likesCount = await prisma.like.count({
      where: { postId: postId }
    })

    return NextResponse.json(
      { 
        message: isLiked ? 'Post geliked' : 'Like entfernt',
        isLiked,
        likesCount
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Like toggle error:', error)
    return NextResponse.json(
      { error: 'Server Fehler beim Like-Toggle' },
      { status: 500 }
    )
  }
}