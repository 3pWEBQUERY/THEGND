'use client'

import { Flame, Clock, TrendingUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const SORTS = [
  { key: 'hot', label: 'Hot', icon: Flame },
  { key: 'new', label: 'Neu', icon: Clock },
  { key: 'top', label: 'Top', icon: TrendingUp },
] as const

type SortKey = (typeof SORTS)[number]['key']

interface FeedSortTabsProps {
  active: SortKey
  onChange: (sort: SortKey) => void
}

export default function FeedSortTabs({ active, onChange }: FeedSortTabsProps) {
  return (
    <div className="flex items-center gap-1 border border-gray-200 bg-white p-1">
      {SORTS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-widest font-light transition-colors',
            active === key
              ? 'bg-pink-500 text-white'
              : 'text-gray-600 hover:bg-gray-100',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}
