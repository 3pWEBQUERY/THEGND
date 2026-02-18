'use client'

import { MessageCircle } from 'lucide-react'

export type SimpleVisitor = {
  id: string
  displayName: string
  avatar: string | null
}

type Props = {
  visitors: SimpleVisitor[] | null | undefined
}

export default function ProfileVisitorsTab({ visitors }: Props) {
  if (!visitors || visitors.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="h-16 w-16 mx-auto mb-6 opacity-30 text-gray-400" />
        <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">KEINE BESUCHER</h3>
        <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
        <p className="text-sm font-light tracking-wide text-gray-500">Keine Besucher verfügbar</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {visitors.map((visitor, index) => (
        <div key={`${visitor.id}-${index}`} className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
            {visitor.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={visitor.avatar} alt={visitor.displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-gray-600 text-sm">{(visitor.displayName || '').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="text-[10px] tracking-widest text-gray-700 text-center truncate w-full" title={visitor.displayName}>{visitor.displayName}</div>
        </div>
      ))}
    </div>
  )
}
