import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getActivePerkUsers } from '@/lib/perks'
import { z } from 'zod'
import path from 'path'
import { promises as fs } from 'fs'
import { spawn } from 'child_process'

export const runtime = 'nodejs'

const urlOrPath = z
  .string()
  .min(1)
  .refine((v) => v.startsWith('/') || /^https?:\/\//.test(v), 'Ungültige Medien-URL/Pfad')

const createStorySchema = z
  .object({
    content: z.string().max(500, 'Story-Inhalt darf maximal 500 Zeichen haben').optional().default(''),
    image: urlOrPath.optional(),
    video: urlOrPath.optional(),
    expiresAt: z.string().datetime().optional(),
    posterDataUrl: z
      .string()
      .refine((v) => v.startsWith('data:image/'), 'Ungültiges Poster-Bild')
      .optional()
  })
  .refine(
    (data) => (data.content?.trim()?.length ?? 0) > 0 || !!data.image || !!data.video,
    { message: 'Inhalt oder Bild/Video ist erforderlich' }
  )

async function savePosterDataUrl(dataUrl: string): Promise<string | null> {
  try {
    const match = dataUrl.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/)
    if (!match) return null
    const ext = match[2] === 'jpeg' ? 'jpg' : match[2]
    const b64 = match[3]
    const buf = Buffer.from(b64, 'base64')
    const projectRoot = process.cwd()
    const postersDir = path.join(projectRoot, 'public', 'uploads', 'posters')
    await fs.mkdir(postersDir, { recursive: true })
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const absOut = path.join(postersDir, fileName)
    await fs.writeFile(absOut, buf)
    return `/uploads/posters/${fileName}`
  } catch {
    return null
  }
}

async function generatePosterFromLocalVideo(publicVideoPath: string): Promise<string | null> {
  try {
    const projectRoot = process.cwd()
    const absVideo = path.join(projectRoot, 'public', publicVideoPath.replace(/^\//, ''))
    // Ensure source exists
    await fs.stat(absVideo)

    const postersDir = path.join(projectRoot, 'public', 'uploads', 'posters')
    await fs.mkdir(postersDir, { recursive: true })
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    const absOut = path.join(postersDir, fileName)
    const publicOut = `/uploads/posters/${fileName}`

    await new Promise<void>((resolve, reject) => {
      const ff = spawn('ffmpeg', [
        '-y',
        '-ss', '0.1',
        '-i', absVideo,
        '-frames:v', '1',
        '-q:v', '2',
        absOut
      ])
      let stderr = ''
      ff.stderr.on('data', (d) => {
        stderr += String(d)
      })
      ff.on('error', (err) => reject(err))
      ff.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`))
      })
    })

    return publicOut
  } catch (e) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Get stories from followed users and own stories
    const stories = await prisma.story.findMany({
      where: {
        OR: [
          {
            authorId: session.user.id
          },
          {
            author: {
              followers: {
                some: {
                  followerId: session.user.id
                }
              }
            }
          }
        ],
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        author: {
          include: {
            profile: true
          }
        },
        views: {
          where: {
            userId: session.user.id
          }
        },
        _count: {
          select: {
            views: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Perk-based spotlight reordering: move authors with STORY_SPOTLIGHT_7D to the top
    try {
      const authorIds = Array.from(new Set(stories.map((s) => s.authorId)))
      const active = await getActivePerkUsers(authorIds, 'STORY_SPOTLIGHT_7D', 7)
      if (active.size > 0) {
        const boosted = stories.filter((s) => active.has(s.authorId))
        const regular = stories.filter((s) => !active.has(s.authorId))
        // Keep relative order inside groups
        return NextResponse.json([...boosted, ...regular])
      }
    } catch {}

    return NextResponse.json(stories)
  } catch (error) {
    console.error('Fehler beim Laden der Stories:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Check if user can create stories (all types except MEMBER)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.userType === 'MEMBER') {
      return NextResponse.json({ error: 'Mitglieder können keine Stories erstellen' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createStorySchema.parse(body)

    // Stories expire after 24 hours by default
    const expiresAt = validatedData.expiresAt ? new Date(validatedData.expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Determine image: prefer provided image -> posterDataUrl -> generated poster from local video
    let imageToUse: string | undefined = validatedData.image
    if (!imageToUse && validatedData.posterDataUrl) {
      try {
        const saved = await savePosterDataUrl(validatedData.posterDataUrl)
        if (saved) imageToUse = saved
      } catch {}
    }
    if (!imageToUse && validatedData.video && validatedData.video.startsWith('/')) {
      try {
        const poster = await generatePosterFromLocalVideo(validatedData.video)
        if (poster) imageToUse = poster
      } catch (e) {
        // ignore poster generation failures
      }
    }

    const story = await prisma.story.create({
      data: {
        content: validatedData.content,
        image: imageToUse,
        video: validatedData.video,
        authorId: session.user.id,
        expiresAt
      },
      include: {
        author: {
          include: {
            profile: true
          }
        },
        _count: {
          select: {
            views: true
          }
        }
      }
    })

    return NextResponse.json(story, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ungültige Daten', details: error.issues }, { status: 400 })
    }
    
    console.error('Fehler beim Erstellen der Story:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}