'use client'

type TabKey = 'about' | 'posts' | 'gallery' | 'contact'

type Props = {
  active: TabKey
  onChange: (key: TabKey) => void
}

export default function ProfileTabsBar({ active, onChange }: Props) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'about', label: 'DETAILS' },
    { key: 'posts', label: 'BEITRÄGE' },
    { key: 'gallery', label: 'GALLERIE' },
    { key: 'contact', label: 'KONTAKT' },
  ]

  return (
    <div className="border-b border-gray-100 overflow-x-auto no-scrollbar">
      <div className="flex gap-2 sm:gap-0 min-w-max">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`shrink-0 sm:flex-1 sm:text-center py-3 sm:py-4 px-4 sm:px-6 text-xs font-light tracking-widest uppercase transition-colors ${
              active === t.key ? 'text-pink-500 border-b-2 border-pink-500' : 'text-gray-600 hover:text-pink-500'
            }`}
            onClick={() => onChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
