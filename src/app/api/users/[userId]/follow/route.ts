import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: any
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { userId: targetUserId } = await params
    const currentUserId = session.user.id

    if (currentUserId === targetUserId) {
      return NextResponse.json({ error: 'Sie können sich nicht selbst folgen' }, { status: 400 })
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId
        }
      }
    })

    if (existingFollow) {
      return NextResponse.json({ error: 'Sie folgen diesem Benutzer bereits' }, { status: 400 })
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId
      }
    })

    // Resolve follower display name/company name for all user types
    const follower = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { profile: true }
    })
    const followerName = follower?.profile?.displayName ?? follower?.profile?.companyName ?? 'Ein Nutzer'

    // Create notification for the followed user
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'follow',
        title: 'Neuer Follower',
        message: `${followerName} folgt Ihnen jetzt`
      }
    })

    return NextResponse.json({ message: 'Erfolgreich gefolgt' })
  } catch (error) {
    console.error('Fehler beim Folgen:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { userId: targetUserId } = await params
    const currentUserId = session.user.id

    // Find and delete follow relationship
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId
        }
      }
    })

    if (!follow) {
      return NextResponse.json({ error: 'Sie folgen diesem Benutzer nicht' }, { status: 400 })
    }

    await prisma.follow.delete({
      where: {
        id: follow.id
      }
    })

    return NextResponse.json({ message: 'Erfolgreich entfolgt' })
  } catch (error) {
    console.error('Fehler beim Entfolgen:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}