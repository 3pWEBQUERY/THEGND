'use client'

import * as React from 'react'

type Tab = {
  id: string
  label: string
  content: React.ReactNode
}

type Props = {
  tabs: Tab[]
  initialId?: string
  className?: string
}

export default function Tabs({ tabs, initialId, className }: Props) {
  const [active, setActive] = React.useState<string>(initialId || tabs[0]?.id)

  return (
    <div className={className}>
      <div className="border-b border-gray-200 overflow-x-auto overflow-y-hidden no-scrollbar touch-pan-x overscroll-x-contain overscroll-y-none">
        <div className="flex gap-6 min-w-max whitespace-nowrap">
          {tabs.map((t) => {
            const isActive = t.id === active
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`group shrink-0 relative px-2 py-3 text-xs tracking-widest uppercase transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 ${
                  isActive
                    ? 'text-gray-900 bg-pink-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-pink-50/40'
                }`}
              >
                <span>{t.label.toUpperCase()}</span>
                <span
                  className={`pointer-events-none absolute left-0 bottom-0 h-0.5 transition-all ${
                    isActive
                      ? 'w-full bg-pink-500'
                      : 'w-0 bg-transparent group-hover:w-full group-hover:bg-pink-300'
                  }`}
                />
              </button>
            )
          })}
        </div>
      </div>
      <div className="pt-6">
        {tabs.map((t) => (
          <div key={t.id} style={{ display: t.id === active ? 'block' : 'none' }}>
            {t.content}
          </div>
        ))}
      </div>
    </div>
  )
}
