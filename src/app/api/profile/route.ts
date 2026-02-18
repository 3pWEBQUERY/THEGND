import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Get user with profile data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        posts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            likes: true,
            comments: {
              select: {
                id: true,
                content: true,
                parentId: true,
                createdAt: true,
                author: {
                  select: {
                    id: true,
                    email: true,
                    profile: {
                      select: {
                        displayName: true,
                        avatar: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        followers: {
          include: {
            follower: {
              select: {
                id: true,
                email: true,
                userType: true,
                profile: {
                  select: {
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        following: {
          include: {
            following: {
              select: {
                id: true,
                email: true,
                userType: true,
                profile: {
                  select: {
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        stories: {
          where: {
            expiresAt: { gt: new Date() },
            isActive: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) {
      try {
        console.warn('Profile GET: user not found for session user.id. Possible stale session or deleted account.', { sessionUserId: session.user.id })
      } catch {}
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Parse JSON fields if they exist
    if (user.profile) {
      // arrays
      if (user.profile.languages) {
        try {
          (user.profile as any).languages = JSON.parse(user.profile.languages)
        } catch {
          (user.profile as any).languages = []
        }
      }

      if (user.profile.gallery) {
        try {
          (user.profile as any).gallery = JSON.parse(user.profile.gallery)
        } catch {
          (user.profile as any).gallery = []
        }
      }

      if ((user.profile as any).media) {
        try {
          (user.profile as any).media = JSON.parse((user.profile as any).media)
        } catch {
          (user.profile as any).media = []
        }
      }

      if (user.profile.services) {
        try {
          (user.profile as any).services = JSON.parse(user.profile.services)
        } catch {
          (user.profile as any).services = []
        }
      }

      if (user.profile.socialMedia) {
        try {
          (user.profile as any).socialMedia = JSON.parse(user.profile.socialMedia)
        } catch {
          (user.profile as any).socialMedia = {}
        }
      }

      if (user.profile.preferences) {
        try {
          (user.profile as any).preferences = JSON.parse(user.profile.preferences)
        } catch {
          (user.profile as any).preferences = {}
        }
      }
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user as any

    return NextResponse.json(
      { user: userWithoutPassword },
      { status: 200 }
    )
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Server Fehler beim Laden des Profils' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { profileData } = body

    // Update profile
    const updatedProfile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        ...profileData,
        // Stringify JSON fields
        languages: profileData.languages ? JSON.stringify(profileData.languages) : undefined,
        gallery: profileData.gallery ? JSON.stringify(profileData.gallery) : undefined,
        media: profileData.media ? JSON.stringify(profileData.media) : undefined,
        services: profileData.services ? JSON.stringify(profileData.services) : undefined,
        socialMedia: profileData.socialMedia ? JSON.stringify(profileData.socialMedia) : undefined,
        preferences: profileData.preferences ? JSON.stringify(profileData.preferences) : undefined,
      },
      create: {
        userId: session.user.id,
        ...profileData,
        // Stringify JSON fields
        languages: profileData.languages ? JSON.stringify(profileData.languages) : undefined,
        gallery: profileData.gallery ? JSON.stringify(profileData.gallery) : undefined,
        media: profileData.media ? JSON.stringify(profileData.media) : undefined,
        services: profileData.services ? JSON.stringify(profileData.services) : undefined,
        socialMedia: profileData.socialMedia ? JSON.stringify(profileData.socialMedia) : undefined,
        preferences: profileData.preferences ? JSON.stringify(profileData.preferences) : undefined,
      }
    })

    return NextResponse.json(
      { 
        message: 'Profil erfolgreich aktualisiert',
        profile: updatedProfile 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Server Fehler beim Aktualisieren des Profils' },
      { status: 500 }
    )
  }
}