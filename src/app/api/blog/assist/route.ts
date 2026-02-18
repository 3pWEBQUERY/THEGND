import { NextRequest, NextResponse } from 'next/server'
import { callGemini } from '@/lib/gemini'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { text, mode, language } = await req.json()
    const input = (typeof text === 'string' ? text : '').trim()
    const op = (typeof mode === 'string' ? mode : 'improve').toLowerCase() as 'proofread' | 'improve' | 'extend'
    const lang = (typeof language === 'string' ? language : 'de').trim() || 'de'

    if (!input) return NextResponse.json({ error: 'Text ist erforderlich.' }, { status: 400 })

    const task = op === 'proofread'
      ? 'Korrigiere Grammatik, Rechtschreibung und Zeichensetzung. Bewahre Stil und Bedeutung. Formatiere in gut lesbaren Absätzen.'
      : op === 'extend'
      ? 'Verbessere und erweitere den Text. Mache ihn professioneller, konkreter und gehaltvoller. Nutze präzise Sprache, vermeide Wiederholungen.'
      : 'Verbessere Stil, Klarheit und Struktur. Mache den Text professioneller und flüssiger. Kürze unnötige Füllwörter.'

    const system = `Du bist ein professioneller Redakteur. Arbeite im folgenden Modus: ${op} (${task}). Antworte ausschließlich auf ${lang}. Gib NUR den überarbeiteten Text zurück, ohne Erklärungen oder Markups.`

    const output = await callGemini(input, { system, temperature: 0.5 })

    return NextResponse.json({ output })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unbekannter Fehler.' }, { status: 500 })
  }
}
