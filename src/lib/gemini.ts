/**
 * Shared Gemini Flash helper.
 * Uses the Google Generative Language REST API (v1beta) with an API-key.
 *
 * Model: gemini-2.0-flash  (fast, cost-efficient)
 */

const GEMINI_MODEL = 'gemini-2.0-flash'

export interface GeminiOptions {
  /** System instruction (optional – maps to systemInstruction). */
  system?: string
  /** Temperature 0-2 (default 0.5). */
  temperature?: number
}

/**
 * Send a single user prompt to Gemini and return the text response.
 *
 * @throws {Error} when the API key is missing or the request fails.
 */
export async function callGemini(
  userPrompt: string,
  opts: GeminiOptions = {},
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY ist nicht gesetzt.')

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

  const body: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: opts.temperature ?? 0.5,
    },
  }

  if (opts.system) {
    body.systemInstruction = {
      parts: [{ text: opts.system }],
    }
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '')
    throw new Error(`Gemini API Fehler: ${resp.status} ${errText}`)
  }

  const data = await resp.json()
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() ?? ''

  if (!text) throw new Error('Keine Antwort von Gemini erhalten.')

  return text
}
