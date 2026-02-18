import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })

    const url = new URL(req.url)
    const idsParam = url.searchParams.get('ids') || ''
    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean)
    if (ids.length === 0) return NextResponse.json({ users: [] }, { status: 200 })

    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        email: true,
        profile: {
          select: { displayName: true, avatar: true, gallery: true }
        }
      }
    })

    const result = users.map(u => {
      let galleryFirst: string | null = null
      try {
        const g = u.profile?.gallery ? JSON.parse(u.profile.gallery) : []
        galleryFirst = Array.isArray(g) ? (g[0] || null) : null
      } catch {}
      return {
        id: u.id,
        displayName: u.profile?.displayName ?? u.email.split('@')[0],
        avatar: u.profile?.avatar ?? null,
        galleryFirst,
      }
    })

    return NextResponse.json({ users: result }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: 'Server Fehler' }, { status: 500 })
  }
}
