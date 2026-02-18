"use client"

import Image from 'next/image'

export type EscortLikesSectionProps = {
  likesReceived: any[]
  setLikesReceived: (updater: (prev: any[]) => any[]) => void
  likesLoading: boolean
  likesFilter: 'all' | 'new' | 'liked_back'
  setLikesFilter: (v: 'all' | 'new' | 'liked_back') => void
  setMutual: (updater: (prev: any[]) => any[]) => void | ((value: any[]) => void)
  show: (message: string, opts?: { variant?: 'success' | 'info' | 'error' }) => void
}

export default function EscortLikesSection({ likesReceived, setLikesReceived, likesLoading, likesFilter, setLikesFilter, setMutual, show }: EscortLikesSectionProps) {
  const allC = likesReceived.length
  const newC = likesReceived.filter((l: any) => !l.liked_back).length
  const likedC = likesReceived.filter((l: any) => !!l.liked_back).length

  const handlePass = async (id: string) => {
    await fetch('/api/matching/escort/swipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId: id, action: 'PASS' }) })
    setLikesReceived(prev => prev.filter((x: any) => x.id !== id))
    show('Abgelehnt', { variant: 'info' })
  }

  const handleLikeBack = async (id: string) => {
    await fetch('/api/matching/escort/swipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId: id, action: 'LIKE' }) })
    setLikesReceived(prev => prev.map((x: any) => x.id === id ? { ...x, liked_back: true } : x))
    show('Geliked', { variant: 'success' })
    try {
      const r = await fetch('/api/matching/mutual?limit=24')
      const d = await r.json()
      if (r.ok) {
        if (typeof setMutual === 'function') (setMutual as any)((_prev: any[]) => Array.isArray(d?.matches) ? d.matches : [])
      }
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-thin tracking-wider text-gray-800">ERHALTENE LIKES</h3>
        <div className="flex items-center gap-2 text-xs">
          <button onClick={() => setLikesFilter('all')} className={`px-3 py-1 border ${likesFilter==='all' ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-300 text-gray-700'}`}>ALLE ({allC})</button>
          <button onClick={() => setLikesFilter('new')} className={`px-3 py-1 border ${likesFilter==='new' ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-300 text-gray-700'}`}>NEU ({newC})</button>
          <button onClick={() => setLikesFilter('liked_back')} className={`px-3 py-1 border ${likesFilter==='liked_back' ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-300 text-gray-700'}`}>GEGENGELIKET ({likedC})</button>
        </div>
      </div>

      {likesLoading ? (
        <div className="text-sm text-gray-500">Lade…</div>
      ) : likesReceived.length === 0 ? (
        <div className="text-sm text-gray-500">Noch keine Likes</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {likesReceived
            .filter((l: any) => likesFilter === 'all' ? true : likesFilter === 'new' ? !l.liked_back : !!l.liked_back)
            .map((l: any) => {
              let thumb: string | null = null
              try {
                const g = l.gallery ? JSON.parse(l.gallery) : []
                thumb = Array.isArray(g) ? (g[0] || null) : null
              } catch {}
              const img = l.avatar || thumb
              return (
                <div key={l.id} className="border border-gray-200">
                  <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                    {img ? (
                      <Image src={img} alt={l.displayName || l.email} fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">KEIN BILD</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium tracking-wider text-gray-900 truncate">{l.displayName || l.email}</div>
                      {l.liked_back && (
                        <span className="text-[10px] uppercase tracking-widest bg-pink-100 text-pink-700 px-2 py-0.5">MATCH</span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button onClick={() => handlePass(l.id)} className="flex-1 text-xs px-3 py-2 border border-gray-300">ABLEHNEN</button>
                      <button onClick={() => handleLikeBack(l.id)} className="flex-1 text-xs px-3 py-2 bg-pink-500 text-white">LIKE ZURÜCK</button>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
