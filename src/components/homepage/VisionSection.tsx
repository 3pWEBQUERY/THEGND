 'use client'

 import { Button } from '@/components/ui/button'
 import { useEffect, useState } from 'react'
 import { ChevronUp, ChevronDown } from 'lucide-react'
 import type { EscortItem } from '@/types/escort'

export default function VisionSection() {
  const [activeEscort, setActiveEscort] = useState(0)
  const [items, setItems] = useState<EscortItem[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/escorts/search?take=5', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setItems(Array.isArray(data.items) ? data.items : [])
        } else {
          setItems([])
        }
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    })()
  }, [])
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-thin tracking-wider text-gray-800 mb-6">PREMIUM ESCORTS</h2>
            <div className="w-24 h-px bg-pink-500 mb-8"></div>
            <p className="text-lg font-light leading-relaxed text-gray-600 mb-8">
              We believe in creating exceptional experiences through our carefully curated selection 
              of premium companions. Discretion, quality and professionalism are our core values.
            </p>
            <Button className="bg-pink-500 hover:bg-pink-600 text-white text-sm font-light tracking-widest px-8 py-3">
              ENTDECKE WEITER
            </Button>
          </div>
          <div className="aspect-[4/5] md:h-[500px] bg-gray-200 relative flex">
            {/* Active Escort Image */}
            <div className="flex-1 h-full bg-gray-300 flex items-center justify-center overflow-hidden">
              {(!loading && items && items.length > 0) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={items[activeEscort]?.image ?? '/escort.png'}
                  alt={(items[activeEscort]?.name ?? 'Escort') as string}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-gray-500 text-lg tracking-widest">VISION IMAGE</span>
              )}
            </div>
            
            {/* Vertical Escort Tabs */}
            <div className="w-32 bg-white border-l border-gray-200 flex flex-col">
              {/* Header */}
              <div className="p-3 border-b border-gray-200">
                <h3 className="text-xs font-light tracking-widest text-gray-800 text-center">LETZTEN</h3>
              </div>
              
              {/* Escort Tabs */}
              <div className="flex-1 flex flex-col">
                {loading && !items && (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="relative h-20 border-b border-gray-100">
                      <div className="absolute left-2 top-2 w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                      <div className="pl-10 pr-2 py-2">
                        <div className="h-3 w-20 bg-gray-200 animate-pulse" />
                        <div className="h-2 w-16 bg-gray-100 mt-2 animate-pulse" />
                      </div>
                    </div>
                  ))
                )}

                {items?.map((escort, index) => (
                  <button
                    key={escort.id}
                    onClick={() => setActiveEscort(index)}
                    className={`relative h-20 border-b border-gray-100 transition-all duration-300 group ${
                      activeEscort === index 
                        ? 'bg-pink-50 border-l-2 border-l-pink-500' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Mini Image */}
                    <div className="absolute left-2 top-2 w-6 h-6 bg-gray-300 rounded-full overflow-hidden">
                      {escort.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={escort.image} alt={escort.name ?? ''} className="h-full w-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-400"></div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="pl-10 pr-2 py-2 text-left">
                      <div className={`text-xs font-light tracking-wider ${
                        activeEscort === index ? 'text-pink-600' : 'text-gray-800'
                      }`}>
                        {escort.name?.toUpperCase?.() ?? escort.name ?? '—'}
                      </div>
                      {(escort.city || escort.country) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {escort.city || escort.country}
                        </div>
                      )}
                    </div>
                    
                    {/* Active Indicator */}
                    {activeEscort === index && (
                      <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                        <div className="w-1 h-1 bg-pink-500 rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Navigation */}
              <div className="p-2 border-t border-gray-200 flex justify-center space-x-2">
                <button
                  className="p-1 text-gray-400 hover:text-pink-500 transition-colors"
                  onClick={() => setActiveEscort((i) => Math.max(0, i - 1))}
                  aria-label="Vorheriger"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  className="p-1 text-gray-400 hover:text-pink-500 transition-colors"
                  onClick={() => setActiveEscort((i) => {
                    const len = items?.length ?? 0
                    if (len === 0) return 0
                    return Math.min(len - 1, i + 1)
                  })}
                  aria-label="Nächster"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}