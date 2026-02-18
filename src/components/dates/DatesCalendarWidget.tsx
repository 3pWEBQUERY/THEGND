"use client"

import { useEffect, useMemo, useState } from 'react'
import { SiApple } from 'react-icons/si'

type Props = {
  scope?: 'ESCORT' | 'MEMBER'
  onSelect?: (item: DateRequest) => void
}

type DateRequest = {
  id: string
  escortId: string
  memberId: string
  startsAt: string
  endsAt: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELED'
  placeLabel?: string | null
  city?: string | null
  location?: string | null
  durationMinutes?: number | null
  priceCents?: number | null
  currency?: string | null
  extras?: any
  note?: string | null
  outfitLabel?: string | null
  placeKey?: string | null
}

export default function DatesCalendarWidget({ scope = 'MEMBER', onSelect }: Props) {
  const [view, setView] = useState<'day' | 'week' | 'month'>(() => {
    try { return (localStorage.getItem('datesView') as any) || 'day' } catch { return 'day' }
  })
  const [today, setToday] = useState(() => new Date())
  const [items, setItems] = useState<DateRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [icsToken, setIcsToken] = useState<string | null>(null)
  const [icsBusy, setIcsBusy] = useState(false)

  useEffect(() => {
    try { localStorage.setItem('datesView', view) } catch {}
  }, [view])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/dates/my?scope=${scope}`, { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled) setItems(Array.isArray(data?.requests) ? data.requests : [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [scope])

  // Load existing ICS token (if any)
  useEffect(() => {
    let cancelled = false
    const loadToken = async () => {
      try {
        const res = await fetch('/api/dates/ics/token', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        if (!cancelled) setIcsToken(typeof data?.token === 'string' && data.token ? data.token : null)
      } catch {}
    }
    loadToken()
    return () => { cancelled = true }
  }, [])

  const range = useMemo(() => {
    const start = new Date(today)
    const end = new Date(today)
    if (view === 'day') {
      // same day
    } else if (view === 'week') {
      const day = start.getDay() || 7
      start.setDate(start.getDate() - (day - 1))
      end.setDate(start.getDate() + 6)
    } else {
      start.setDate(1)
      end.setMonth(start.getMonth() + 1)
      end.setDate(0)
    }
    start.setHours(0,0,0,0)
    end.setHours(23,59,59,999)
    return { start, end }
  }, [today, view])

  const filtered = useMemo(() => {
    const s = range.start.getTime()
    const e = range.end.getTime()
    return items.filter(it => {
      const t = new Date(it.startsAt).getTime()
      return t >= s && t <= e && it.status === 'ACCEPTED'
    })
  }, [items, range])

  const goPrev = () => {
    const d = new Date(today)
    if (view === 'day') d.setDate(d.getDate() - 1)
    else if (view === 'week') d.setDate(d.getDate() - 7)
    else d.setMonth(d.getMonth() - 1)
    setToday(d)
  }
  const goNext = () => {
    const d = new Date(today)
    if (view === 'day') d.setDate(d.getDate() + 1)
    else if (view === 'week') d.setDate(d.getDate() + 7)
    else d.setMonth(d.getMonth() + 1)
    setToday(d)
  }

  const fmtDate = (d: Date) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const fmtTime = (d: Date) => d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const dayKey = (d: Date) => {
    const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`
  }
  const groupByDay = (arr: DateRequest[]) => {
    const map: Record<string, DateRequest[]> = {}
    for (const it of arr) {
      const k = dayKey(new Date(it.startsAt))
      if (!map[k]) map[k] = []
      map[k].push(it)
    }
    // sort each day's items by start time
    for (const k of Object.keys(map)) {
      map[k].sort((a,b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    }
    return map
  }

  const googleLink = (it: DateRequest) => {
    const s = new Date(it.startsAt)
    const e = new Date(it.endsAt)
    const f = (dt: Date) => {
      const y = dt.getUTCFullYear(); const m = String(dt.getUTCMonth()+1).padStart(2,'0'); const d = String(dt.getUTCDate()).padStart(2,'0'); const hh = String(dt.getUTCHours()).padStart(2,'0'); const mm = String(dt.getUTCMinutes()).padStart(2,'0'); const ss = String(dt.getUTCSeconds()).padStart(2,'0');
      return `${y}${m}${d}T${hh}${mm}${ss}Z`
    }
    const text = encodeURIComponent('Date')
    const dates = `${f(s)}/${f(e)}`
    const details = ''
    const location = encodeURIComponent((it as any).location || [it.placeLabel, it.city].filter(Boolean).join(', '))
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&location=${location}&sf=true&output=xml`
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const feedUrl = icsToken ? `${origin}/api/dates/ics/feed?token=${encodeURIComponent(icsToken)}` : ''
  const googleAddUrl = feedUrl ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feedUrl)}` : ''
  const outlookAddUrl = feedUrl ? `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(feedUrl)}` : ''
  const copyFeed = async () => {
    try { if (feedUrl) { await navigator.clipboard.writeText(feedUrl) } } catch {}
  }
  const generateToken = async () => {
    setIcsBusy(true)
    try {
      const res = await fetch('/api/dates/ics/token', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.token) setIcsToken(data.token)
    } finally {
      setIcsBusy(false)
    }
  }

  return (
    <div className="bg-white border border-gray-100 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={goPrev} className="px-2 py-1 border border-gray-300 text-xs uppercase tracking-widest">Zurück</button>
          <div className="text-sm text-gray-700">{fmtDate(range.start)} – {fmtDate(range.end)}</div>
          <button onClick={() => setToday(new Date())} className="sm:ml-2 w-full sm:w-auto basis-full sm:basis-auto order-3 sm:order-none px-2 py-1 border border-gray-300 text-xs uppercase tracking-widest">Heute</button>
          <button onClick={goNext} className="ml-2 px-2 py-1 border border-gray-300 text-xs uppercase tracking-widest">Weiter</button>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto sm:flex sm:items-center">
          <button onClick={() => setView('day')} className={`w-full px-2 py-1 border text-xs uppercase tracking-widest ${view==='day'?'border-pink-500 text-pink-600':'border-gray-300'}`}>Tag</button>
          <button onClick={() => setView('week')} className={`w-full px-2 py-1 border text-xs uppercase tracking-widest ${view==='week'?'border-pink-500 text-pink-600':'border-gray-300'}`}>Woche</button>
          <button onClick={() => setView('month')} className={`w-full px-2 py-1 border text-xs uppercase tracking-widest ${view==='month'?'border-pink-500 text-pink-600':'border-gray-300'}`}>Monat</button>
        </div>
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-gray-500">Lade…</div>
        ) : view === 'day' ? (
          <div className="border border-gray-200 p-3 min-h-[280px] sm:min-h-[420px]">
            <div className="text-xs uppercase tracking-widest text-gray-600">{fmtDate(range.start)}</div>
            {filtered.length === 0 ? (
              <div className="mt-2 text-sm text-gray-500">Keine Termine.</div>
            ) : (
              <ul className="mt-2 space-y-2">
                {filtered.map((it) => {
                  const s = new Date(it.startsAt); const e = new Date(it.endsAt)
                  return (
                    <li
                      key={it.id}
                      className="border border-gray-200 p-2 cursor-pointer hover:border-pink-400 hover:bg-pink-50/50"
                      onClick={() => onSelect?.(it)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-gray-800 text-sm">{fmtTime(s)} – {fmtTime(e)}</div>
                        <div className="flex items-center gap-2">
                          <a href={`/api/dates/ics?id=${it.id}`} className="text-[11px] uppercase tracking-widest border px-2 py-1">ICS</a>
                          <a href={googleLink(it)} target="_blank" className="text-[11px] uppercase tracking-widest border px-2 py-1">Google</a>
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(it.location || [it.placeLabel, it.city].filter(Boolean).join(', '))}`} target="_blank" className="text-[11px] uppercase tracking-widest border px-2 py-1">Maps</a>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{it.location || [it.placeLabel, it.city].filter(Boolean).join(', ')}</div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ) : view === 'week' ? (
          (() => {
            const days: Date[] = []
            const d = new Date(range.start)
            while (d <= range.end) { days.push(new Date(d)); d.setDate(d.getDate()+1) }
            const byDay = groupByDay(filtered)
            const weekday = ['Mo','Di','Mi','Do','Fr','Sa','So']
            return (
              <div className="border border-gray-200">
                {/* Desktop/Tablet: 7 Spalten Grid */}
                <div className="hidden sm:block">
                  <div className="grid grid-cols-7 text-center text-[11px] uppercase tracking-widest text-gray-600 border-b border-gray-200">
                    {days.map((dd, idx) => (
                      <div key={idx} className="px-2 py-2">{weekday[idx]} {String(dd.getDate()).padStart(2,'0')}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-px bg-gray-200">
                    {days.map((dd, idx) => {
                      const key = dayKey(dd)
                      const list = byDay[key] || []
                      return (
                        <div key={idx} className="bg-white p-2 min-h-[180px] sm:min-h-[260px]">
                          {list.length === 0 ? (
                            <div className="text-[11px] text-gray-400">–</div>
                          ) : (
                            <ul className="space-y-1">
                              {list.map((it) => {
                                const s = new Date(it.startsAt); const e = new Date(it.endsAt)
                                return (
                                  <li
                                    key={it.id}
                                    className="border border-gray-200 p-1 cursor-pointer hover:border-pink-400 hover:bg-pink-50/50"
                                    onClick={() => onSelect?.(it)}
                                  >
                                    <div className="text-[11px] text-gray-800">{fmtTime(s)} – {fmtTime(e)}</div>
                                    <div className="text-[10px] text-gray-600 line-clamp-2">{it.location || [it.placeLabel, it.city].filter(Boolean).join(', ')}</div>
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Mobile: 1 Tag pro Slide, horizontal scrollbar */}
                <div className="block sm:hidden">
                  <div className="flex overflow-x-auto snap-x snap-mandatory gap-2">
                    {days.map((dd, idx) => {
                      const key = dayKey(dd)
                      const list = byDay[key] || []
                      return (
                        <div key={idx} className="snap-center min-w-full border-l border-gray-200">
                          <div className="px-3 py-2 text-[11px] uppercase tracking-widest text-gray-600 border-b border-gray-200">
                            {weekday[idx]} {String(dd.getDate()).padStart(2,'0')}
                          </div>
                          <div className="p-3 min-h-[340px]">
                            {list.length === 0 ? (
                              <div className="text-[11px] text-gray-400">Keine Termine.</div>
                            ) : (
                              <ul className="space-y-2">
                                {list.map((it) => {
                                  const s = new Date(it.startsAt); const e = new Date(it.endsAt)
                                  return (
                                    <li
                                      key={it.id}
                                      className="border border-gray-200 p-2 cursor-pointer hover:border-pink-400 hover:bg-pink-50/50"
                                      onClick={() => onSelect?.(it)}
                                    >
                                      <div className="text-[12px] text-gray-800">{fmtTime(s)} – {fmtTime(e)}</div>
                                      <div className="text-[11px] text-gray-600">{it.location || [it.placeLabel, it.city].filter(Boolean).join(', ')}</div>
                                    </li>
                                  )
                                })}
                              </ul>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })()
        ) : (
          (() => {
            // month view grid (Mon-Sun)
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
            const endOfMonth = new Date(today.getFullYear(), today.getMonth()+1, 0)
            const startDay = (startOfMonth.getDay() || 7) // 1..7 Mon..Sun
            const gridStart = new Date(startOfMonth)
            gridStart.setDate(startOfMonth.getDate() - (startDay - 1))
            const endDay = (endOfMonth.getDay() || 7)
            const gridEnd = new Date(endOfMonth)
            gridEnd.setDate(endOfMonth.getDate() + (7 - endDay))
            const days: Date[] = []
            const d = new Date(gridStart)
            while (d <= gridEnd) { days.push(new Date(d)); d.setDate(d.getDate()+1) }
            const byDay = groupByDay(filtered)
            const weekday = ['Mo','Di','Mi','Do','Fr','Sa','So']
            return (
              <div className="border border-gray-200">
                <div className="grid grid-cols-7 text-center text-[11px] uppercase tracking-widest text-gray-600 border-b border-gray-200">
                  {weekday.map((w) => (<div key={w} className="px-2 py-2">{w}</div>))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-gray-200">
                  {days.map((dd, idx) => {
                    const key = dayKey(dd)
                    const list = byDay[key] || []
                    const isCurrentMonth = dd.getMonth() === today.getMonth()
                    return (
                      <div key={idx} className={`bg-white p-2 min-h-[180px] sm:min-h-[260px] ${isCurrentMonth ? '' : 'opacity-50'}`}>
                        <div className="text-[11px] text-gray-800 mb-1">{String(dd.getDate()).padStart(2,'0')}</div>
                        {list.length === 0 ? (
                          <div className="text-[11px] text-gray-400">–</div>
                        ) : (
                          <ul className="space-y-1">
                            {list.map((it) => {
                              const s = new Date(it.startsAt); const e = new Date(it.endsAt)
                              return (
                                <li
                                  key={it.id}
                                  className="border border-gray-200 p-1 cursor-pointer hover:border-pink-400 hover:bg-pink-50/50"
                                  onClick={() => onSelect?.(it)}
                                >
                                  <div className="text-[11px] text-gray-800">{fmtTime(s)} – {fmtTime(e)}</div>
                                  <div className="text-[10px] text-gray-600 line-clamp-2">{it.location || [it.placeLabel, it.city].filter(Boolean).join(', ')}</div>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()
        )}
      </div>
      {/* ICS subscription section */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="text-sm font-light tracking-widest text-gray-800 uppercase">Kalender abonnieren</div>
        {icsToken ? (
          <div className="mt-2 flex flex-col gap-3">
            <input readOnly value={feedUrl} className="w-full border border-gray-200 px-3 py-2 text-sm" />
            <div className="grid grid-cols-3 gap-2">
              <a href={feedUrl} className="flex items-center justify-center gap-2 px-3 py-2 bg-pink-500 hover:bg-pink-600 text-white text-[11px] uppercase tracking-widest rounded-none">
                <SiApple className="h-4 w-4" /> Apple
              </a>
              <a href={googleAddUrl} target="_blank" className="flex items-center justify-center gap-2 px-3 py-2 bg-pink-500 hover:bg-pink-600 text-white text-[11px] uppercase tracking-widest rounded-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Google_Calendar_icon.svg" alt="Google Calendar" className="h-4 w-4" /> Google
              </a>
              <a href={outlookAddUrl} target="_blank" className="flex items-center justify-center gap-2 px-3 py-2 bg-pink-500 hover:bg-pink-600 text-white text-[11px] uppercase tracking-widest rounded-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/outlook.svg" alt="Outlook" className="h-4 w-4" /> Outlook
              </a>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={copyFeed} className="text-[11px] uppercase tracking-widest border px-2 py-1 hover:bg-pink-50 hover:border-pink-300">Link kopieren</button>
              <button onClick={generateToken} disabled={icsBusy} className="text-[11px] uppercase tracking-widest border px-2 py-1 hover:bg-pink-50 hover:border-pink-300">{icsBusy ? 'Erzeuge…' : 'Neues Token'}</button>
            </div>
            <div className="text-xs text-gray-500">
              Die ICS-Events enthalten die <span className="font-medium">exakte Adresse (LOCATION)</span>.
              Bei Terminen mit Vorschlag steht in der Beschreibung: <em>„Adresse aus Vorschlag gewählt“</em>, sonst <em>„Adresse manuell eingegeben“</em>.
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <button onClick={generateToken} disabled={icsBusy} className="text-[11px] uppercase tracking-widest border px-3 py-2">{icsBusy ? 'Erzeuge…' : 'Token generieren'}</button>
            <div className="mt-2 text-xs text-gray-500 max-w-prose">Nach dem Generieren erhältst du eine persönliche iCal-Feed-URL zum Abonnieren in deinem Kalender.</div>
          </div>
        )}
      </div>
    </div>
  )
}
