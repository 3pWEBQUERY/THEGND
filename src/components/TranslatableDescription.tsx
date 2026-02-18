"use client"

import React from "react"
import ExpandableText from "@/components/ExpandableText"

type Props = {
  text: string
  limit?: number
  className?: string
  buttonClassName?: string
}

export default function TranslatableDescription({ text, limit = 600, className = "text-sm text-gray-700 mt-3 leading-relaxed", buttonClassName = "mt-3 text-xs font-light tracking-widest uppercase text-pink-500 hover:text-pink-600" }: Props) {
  const [translated, setTranslated] = React.useState<string | null>(null)
  const [showTranslated, setShowTranslated] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const targetLang = React.useMemo(() => {
    if (typeof navigator !== "undefined") {
      const lang = navigator.language || (navigator as any).userLanguage || "de"
      return String(lang).toLowerCase().split("-")[0]
    }
    return "de"
  }, [])

  async function handleTranslate() {
    if (showTranslated) {
      setShowTranslated(false)
      return
    }
    if (translated) {
      setShowTranslated(true)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `Übersetzung fehlgeschlagen (${res.status})`)
      }
      const data = await res.json()
      const out = String(data?.translated || "").trim()
      if (!out) throw new Error("Keine Übersetzung erhalten.")
      setTranslated(out)
      setShowTranslated(true)
    } catch (e: any) {
      setError(e?.message || "Unbekannter Fehler bei der Übersetzung.")
    } finally {
      setLoading(false)
    }
  }

  const displayText = showTranslated && translated ? translated : text
  const buttonLabel = showTranslated ? "Original anzeigen" : (loading ? "Übersetze…" : "Übersetzen")

  return (
    <div>
      <div className="mt-2 flex items-center justify-end">
        <button
          type="button"
          onClick={handleTranslate}
          disabled={loading}
          aria-label={showTranslated ? "Original anzeigen" : "Beschreibung übersetzen"}
          className="px-3 py-1 border border-gray-300 rounded-none text-xs tracking-widest hover:border-pink-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {buttonLabel}
        </button>
      </div>
      <ExpandableText
        text={displayText}
        limit={limit}
        className={className}
        buttonClassName={buttonClassName}
      />
      {error && (
        <div className="mt-2 text-xs text-red-600">{error}</div>
      )}
    </div>
  )
}
