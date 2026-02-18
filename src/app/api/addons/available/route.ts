import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const addons = await prisma.addon.findMany({
      where: { active: true },
      select: { key: true },
    })
    const keys = addons.map(a => a.key)
    return NextResponse.json({ activeKeys: keys })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 })
  }
}
