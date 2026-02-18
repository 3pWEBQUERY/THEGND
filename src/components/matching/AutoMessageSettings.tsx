"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AutoMessageSettings() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [autoMessageOnMatch, setAutoMessageOnMatch] = useState<boolean>(true)
  const [autoLikeMessage, setAutoLikeMessage] = useState<string>(
    "Hallo! Danke fürs Match. Ich würde dich gerne kennenlernen und Treffen! Schreib mir gerne zurück!"
  )

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/matching/preferences", { cache: "no-store" })
        const data = await res.json()
        if (res.ok) {
          const p = data?.preferences || {}
          setAutoMessageOnMatch(typeof p.autoMessageOnMatch === "boolean" ? p.autoMessageOnMatch : true)
          setAutoLikeMessage(typeof p.autoLikeMessage === "string" && p.autoLikeMessage ? p.autoLikeMessage : autoLikeMessage)
        } else {
          setError(data?.error || "Fehler beim Laden")
        }
      } catch {
        setError("Fehler beim Laden")
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleReset = () => {
    setAutoMessageOnMatch(true)
    setAutoLikeMessage(
      "Hallo! Danke fürs Match. Ich würde dich gerne kennenlernen und Treffen! Schreib mir gerne zurück!"
    )
    setOk(null)
    setError(null)
  }

  const submit = async () => {
    setSaving(true)
    setError(null)
    setOk(null)
    try {
      const res = await fetch("/api/matching/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoMessageOnMatch, autoLikeMessage }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setOk("Gespeichert")
    } catch (e: any) {
      setError(e?.message || "Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm text-gray-500">Lade…</div>

  return (
    <div className="w-full">
      <div className="space-y-4">
        <div className="space-y-3">
          <h3 className="text-sm font-medium tracking-widest text-gray-800 uppercase">Automatische Nachricht bei Match</h3>
          <label className="flex items-center gap-2 text-xs tracking-widest text-gray-700">
            <input
              type="checkbox"
              checked={autoMessageOnMatch}
              onChange={(e) => setAutoMessageOnMatch(e.target.checked)}
              className="h-4 w-4 border-gray-300"
            />
            BEI MATCH AUTOMATISCH SENDEN
          </label>
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-600 mb-1">Nachricht</label>
            <textarea
              value={autoLikeMessage}
              onChange={(e) => setAutoLikeMessage(e.target.value)}
              rows={6}
              className="mt-1 w-full border border-gray-300 px-3 py-2"
              placeholder="Deine Nachricht, die automatisch bei einem Match gesendet wird"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              Tipp: Du kannst einen Link zu deinen Nachrichten einfügen, z. B. http://localhost:3000/dashboard?tab=messages
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={saving} className="rounded-none bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest px-6 py-3 text-sm uppercase">
            {saving ? "SPEICHERN…" : "SPEICHERN"}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} className="rounded-none border border-gray-300 text-gray-600 font-light tracking-widest px-6 py-3 text-sm uppercase hover:border-pink-500 hover:text-pink-500">
            ZURÜCKSETZEN
          </Button>
          {ok && <span className="text-xs text-emerald-600">{ok}</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>
    </div>
  )
}
