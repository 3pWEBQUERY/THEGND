import { NextRequest, NextResponse } from 'next/server'
import { callGemini } from '@/lib/gemini'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang } = await req.json()
    const input = typeof text === 'string' ? text.trim() : ''
    const lang = typeof targetLang === 'string' ? targetLang.trim().toLowerCase() : ''

    if (!input) {
      return NextResponse.json({ error: 'Text ist erforderlich.' }, { status: 400 })
    }
    if (!lang) {
      return NextResponse.json({ error: 'Zielsprache fehlt.' }, { status: 400 })
    }

    const system = `Du bist ein professioneller Übersetzer. Übersetze den gegebenen Text präzise ins ${lang}. Behalte Bedeutung, Ton und Formatierung bei. Antworte NUR mit der Übersetzung, ohne zusätzliche Erklärungen.`

    const translated = await callGemini(input, { system, temperature: 0.3 })

    return NextResponse.json({ translated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unbekannter Fehler.' }, { status: 500 })
  }
}
