"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

type FavoriteItem = {
  id: string
  type: "ESCORT" | "HOBBYHURE" | "AGENCY" | "CLUB" | "STUDIO"
  name: string
  city?: string | null
  country?: string | null
  image?: string | null
}

type FavoritesResponse = { items: FavoriteItem[] }

const TYPE_LABELS: Record<FavoriteItem["type"], string> = {
  ESCORT: "Escorts",
  HOBBYHURE: "Hobbyhuren",
  AGENCY: "Agenturen",
  CLUB: "Clubs",
  STUDIO: "Studios",
}

const TYPE_LINK_BASE: Record<FavoriteItem["type"], string> = {
  ESCORT: "/escorts",
  HOBBYHURE: "/hobbyhuren",
  AGENCY: "/agency",
  CLUB: "/club",
  STUDIO: "/studio",
}

const EMPTY_COPY: Record<FavoriteItem["type"], string> = {
  ESCORT: "Du hast noch keine Escorts gespeichert.",
  HOBBYHURE: "Du hast noch keine Hobbyhuren gespeichert.",
  AGENCY: "Du hast noch keine Agenturen gespeichert.",
  CLUB: "Du hast noch keine Clubs gespeichert.",
  STUDIO: "Du hast noch keine Studios gespeichert.",
}

const TYPE_ORDER: FavoriteItem["type"][] = [
  "ESCORT",
  "HOBBYHURE",
  "AGENCY",
  "CLUB",
  "STUDIO",
]

export default function FavoritesSection() {
  const [items, setItems] = useState<FavoriteItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch("/api/favorites", { cache: "no-store" })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.error || "Favoriten konnten nicht geladen werden")
        }
        const data: FavoritesResponse = await res.json()
        setItems(Array.isArray(data?.items) ? data.items : [])
      } catch (e: any) {
        setError(e?.message || "Favoriten konnten nicht geladen werden")
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    items: (items || []).filter((i) => i.type === type),
  }))

  return (
    <section className="space-y-10">
      <header>
        <h1 className="text-2xl md:text-3xl font-thin tracking-wider text-gray-900 uppercase">Favoriten</h1>
        <p className="mt-2 text-sm text-gray-600 max-w-2xl">
          Deine gemerkten Profile im Überblick. Greife schnell auf Escorts, Hobbyhuren, Agenturen, Clubs und Studios zu, die du gespeichert hast.
        </p>
      </header>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Favoriten werden geladen …
        </div>
      )}

      {error && (
        <div className="border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3 text-sm">{error}</div>
      )}

      {!loading && !error && grouped.every((g) => g.items.length === 0) && (
        <div className="border border-gray-200 bg-gray-50 px-6 py-8 text-center text-sm text-gray-600">
          Du hast noch keine Favoriten gespeichert. Tippe auf deinem Lieblingsprofil auf das Herz-Symbol, um es hier abzulegen.
        </div>
      )}

      {grouped.map(({ type, items: groupItems }) => (
        <div key={type} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-light tracking-widest text-gray-800 uppercase">{TYPE_LABELS[type]}</h2>
            <Link href={TYPE_LINK_BASE[type]} className="text-xs font-light tracking-widest uppercase text-gray-600 hover:text-pink-500">
              Alle anzeigen
            </Link>
          </div>

          {groupItems.length === 0 ? (
            <div className="border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500 text-center">
              {EMPTY_COPY[type]}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {groupItems.map((item) => {
                const base = TYPE_LINK_BASE[item.type]
                const href = `${base}/${item.id}`
                return (
                  <Link key={item.id} href={href} className="group block border border-gray-200 hover:border-pink-500 bg-white transition-colors">
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs uppercase tracking-widest">
                          Kein Bild
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-3 space-y-1">
                      <div className="text-base font-medium tracking-widest text-gray-900 truncate">{item.name || "—"}</div>
                      <div className="text-sm text-gray-600 truncate">{item.city || item.country || ""}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </section>
  )
}
