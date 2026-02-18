import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { applyWatermarkToImageBuffer } from '@/lib/watermark'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('profileImage') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'profiles')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename (output is JPEG after watermarking)
    const uniqueFilename = `${uuidv4()}.jpg`
    const filePath = join(uploadsDir, uniqueFilename)

    // Convert file to buffer, watermark, and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Get displayName for watermark (fallback to email username)
    let displayName: string | undefined
    try {
      const prof = await prisma.profile.findUnique({ where: { userId: session.user.id }, select: { displayName: true } })
      displayName = prof?.displayName || (session.user.email?.split('@')[0] ?? undefined)
    } catch {}

    const output = await applyWatermarkToImageBuffer(buffer, displayName)
    await writeFile(filePath, output)

    // Update user profile with new image path
    const imageUrl = `/uploads/profiles/${uniqueFilename}`
    
    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: { avatar: imageUrl },
      create: {
        userId: session.user.id,
        avatar: imageUrl
      }
    })

    return NextResponse.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl
    })

  } catch (error) {
    console.error('Profile image upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}