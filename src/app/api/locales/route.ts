import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const base = join(process.cwd(), 'src', 'locales')
    const entries = await readdir(base, { withFileTypes: true })
    const codes = entries.filter((e) => e.isDirectory()).map((e) => e.name)
    return NextResponse.json({ codes })
  } catch (e: any) {
    return NextResponse.json({ codes: [], error: e?.message || 'failed' }, { status: 500 })
  }
}
